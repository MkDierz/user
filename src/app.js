const { PrismaClient } = require('@prisma/client');
const { httpError } = require('../config');
const errorHandler = require('../utils/errorHandler');
const { exclude, clean, filterObject } = require('../utils/dro');

const prisma = new PrismaClient();

async function profile(req, res, next) {
  const { user } = req;
  const data = {};

  try {
    data.found = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Profile: true, Config: true },
    });
    if (data.found) {
      return res.send({ ...data.found });
    }
    data.created = await prisma.user.create({
      data: {
        ...exclude(user, ['iat', 'exp']),
        name: user.username,
        Profile: {
          create: {},
        },
        Config: {
          create: {},
        },
      },
      include: {
        Profile: true,
        Config: true,
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.created });
}

async function profileById(req, res, next) {
  const { id } = req.params;
  const data = {};

  try {
    data.user = await prisma.user.findUnique({
      where: { id },
      include: { Profile: true },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.user });
}

async function updateProfile(req, res, next) {
  const { user } = req;
  const { authService } = req.services;
  const body = clean(req.body);
  if (Object.keys(body).length === 0) {
    return next(httpError.BadRequest());
  }
  const data = {};

  const authField = ['username', 'password', 'email'];
  const profileField = ['bio', 'location'];
  const userField = ['username', 'email', 'name'];
  const configField = ['compress'];

  data.auth = filterObject(authField, body, data);
  if (!(Object.keys({ ...data.auth }).length === 0)) {
    data.auth = await authService
      .update({ ...data.auth })
      .catch((e) => next(httpError.BadRequest(e)));
  }
  data.profileData = filterObject(profileField, body);
  data.userData = {
    ...filterObject(userField, user),
    ...filterObject(userField, body),
  };
  data.configData = filterObject(configField, body);
  try {
    data.user = await prisma.user.upsert({
      where: {
        id: user.id,
      },
      update: {
        ...data.userData,
      },
      create: {
        id: user.id,
        ...data.userData,
        name: data.userData.username,
      },
    });
    data.profile = await prisma.profile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        ...data.profileData,
      },
      create: {
        userId: user.id,
        ...data.profileData,
      },
    });
    data.config = await prisma.config.upsert({
      where: {
        userId: user.id,
      },
      update: {
        ...data.configData,
      },
      create: {
        userId: user.id,
        ...data.configData,
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.user, profile: data.profile, config: data.config });
}

async function sendFriendRequest(req, res, next) {
  const { user } = req;
  const { username } = req.body;
  const data = {};

  try {
    data.receiver = await prisma.user.findUnique({
      where: { username },
    });
    if (!data.receiver) {
      return next(httpError.NotFound('user not found'));
    }

    data.sender = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (data.receiver.username === data.sender.username) {
      return next(httpError.BadRequest());
    }

    data.request = await prisma.friendRequest.findFirst({
      where: {
        senderId: data.sender.id,
        receiverId: data.receiver.id,
      },
    });

    data.message = 'friend request already sent';

    if (!data.request) {
      data.message = 'friend request sent';
      data.request = await prisma.friendRequest.create(
        {
          data: {
            sender: { connect: { id: data.sender.id } },
            receiver: { connect: { id: data.receiver.id } },
          },
        },
      );
    }
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  ['receiver', 'sender'].forEach((e) => delete data[e]);
  return res.send({ ...data });
}

async function friendRequest(req, res, next) {
  const { user } = req;

  const data = {};
  data.receiver = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!data.receiver) { return next(httpError.NotFound('user not found')); }
  data.request = await prisma.friendRequest.findMany({
    where: {
      receiverId: data.receiver.id,
    },
    include: {
      sender: true,
    },
  });
  return res.send(data.request);
}

async function friendRequestSent(req, res, next) {
  const { user } = req;

  const data = {};
  try {
    data.sender = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!data.sender) { return next(httpError.NotFound('user not found')); }
    data.request = await prisma.friendRequest.findMany({
      where: {
        senderId: data.sender.id,
      },
      include: {
        sender: true,
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.request });
}

async function updateFriendRequest(req, res, next) {
  const { user } = req;
  const { username, status } = req.body;
  const data = {};

  try {
    data.receiver = await prisma.user.findUnique({
      where: { id: user.id },
    });
    data.sender = await prisma.user.findUnique({
      where: { username },
    });
    if (!data.sender) { return next(httpError.NotFound('user not found')); }
    data.request = await prisma.friendRequest.findFirst({
      where: {
        receiverId: data.receiver.id,
        senderId: data.sender.id,
      },
    });
    if (!data.request) { return next(httpError.NotFound('request not found')); }
    data.requestUpdated = await prisma.friendRequest.update({
      where: {
        id: data.request.id,
      },
      data: {
        status,
      },
    });
    if (!data.requestUpdated) { return next(httpError.InternalServerError('unable to accept friend')); }
    if (status === 'ACCEPTED') {
      await prisma.$transaction([
        prisma.friendList.deleteMany({
          where: {
            OR: [
              {
                friendId: data.sender.id,
                friendOfId: data.receiver.id,
              },
              {
                friendId: data.receiver.id,
                friendOfId: data.sender.id,
              },
            ],
          },
        }),
        prisma.friendList.createMany({
          data: [
            { friendId: data.sender.id, friendOfId: data.receiver.id },
            { friendId: data.receiver.id, friendOfId: data.sender.id },
          ],
        }),
      ]);
    }
    if (status === 'UNACCEPTED') {
      await prisma.friendList.deleteMany({
        where: {
          OR: [
            {
              friendId: data.sender.id,
              friendOfId: data.receiver.id,
            },
            {
              friendId: data.receiver.id,
              friendOfId: data.sender.id,
            },
          ],
        },
      });
    }
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.requestUpdated });
}

async function friendList(req, res, next) {
  const { user } = req;
  const data = {};

  try {
    data.friends = await prisma.friendList.findMany({
      where: { friendOfId: user.id },
      include: {
        friend: true,
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.friends);
}

async function findUser(req, res, next) {
  const { query, id } = req.query;
  const data = {};
  if ((!query) && (!id)) {
    return next(httpError.BadRequest());
  }
  try {
    data.userList = await prisma.user.findMany({
      where: {
        ...(query && { username: { search: query }, name: { search: query } }),
        ...(id && { id: { in: id } }),
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.userList.map((user) => exclude(user, ['email'])));
}

module.exports = {
  profile,
  updateProfile,
  sendFriendRequest,
  friendRequest,
  friendRequestSent,
  updateFriendRequest,
  friendList,
  findUser,
  profileById,
};

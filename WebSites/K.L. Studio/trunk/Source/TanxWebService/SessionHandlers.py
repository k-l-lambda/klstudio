
import logging
import datetime
import re

from google.appengine.ext import webapp

from Session import *
from Application import *
import Serializer


def findSessionByPath(path):
    app_id = re.sub('.*/app/([^/]+)/.*', r'\1', path)
    id = re.sub('.*/session/([^/]+)/.*', r'\1', path)
    session = Session.get_by_key_name(id, Application.getById(app_id))

    return (app_id, id, session)


class SessionInfoHandler(webapp.RequestHandler):
    def get(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            self.response.out.write(Serializer.save({'info': session.toDict()}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionKeepAliveHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.alive_time = datetime.datetime.now()
                session.alive = True
                session.put()

                logging.info('session "%s" of app "%s" keep alive at %s.', id, app_id, session.alive_time)

                self.response.out.write(Serializer.save({'result': "OK", 'time': session.alive_time}))
            else:
                self.response.out.write(Serializer.save({'result': "Error", 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write(Serializer.save({'result': "Error", 'error': 'cannot find session'}))


class SessionEndHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.alive = False
                session.put()

                logging.info('session "%s" of app "%s" end at %s.', id, app_id, datetime.datetime.now())

                self.response.out.write(Serializer.save({'result': "End"}))
            else:
                self.response.out.write(Serializer.save({'result': "Error", 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write(Serializer.save({'result': "Error", 'error': 'cannot find session'}))


class SessionSetTagsHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.tags = self.request.get_all('tag')
                session.put()

                logging.info('session "%s" of app "%s" set tags: %s.', id, app_id, session.tags)

                self.response.out.write(Serializer.save({'result': "OK"}))
            else:
                self.response.out.write(Serializer.save({'result': "Error", 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write(Serializer.save({'result': "Error", 'error': 'cannot find session'}))


class SessionChannelMembersHandler(webapp.RequestHandler):
    def get(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                self.response.out.write(Serializer.save({'members': channel.members}))
            else:
                self.response.out.write(Serializer.save({'result': 'Error', 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionChannelAddMemberHandler(webapp.RequestHandler):
    def post(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                member = users.User(self.request.get('member'))

                if not channel.members.count(member):
                    channel.members.append(member)
                    channel.put()

                    logging.info('channel "%s" of session "%s" of app "%s" added member: %s.', id, session_id, app_id, member)

                    self.response.out.write(Serializer.save({'result': "added"}))
                else:
                    self.response.out.write(Serializer.save({'result': "already exists"}))
            else:
                self.response.out.write(Serializer.save({'result': 'Error', 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionChannelRemoveMemberHandler(webapp.RequestHandler):
    def post(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                member = users.User(self.request.get('member'))

                if channel.members.count(member):
                    channel.members.remove(member)
                    channel.put()

                    logging.info('channel "%s" of session "%s" of app "%s" removed member: %s.', id, session_id, app_id, member)

                    self.response.out.write(Serializer.save({'result': "removed"}))
                else:
                    self.response.out.write(Serializer.save({'result': "not exists"}))
            else:
                self.response.out.write(Serializer.save({'result': 'Error', 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionChannelClearMembersHandler(webapp.RequestHandler):
    def post(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                channel.members = []
                channel.put()

                logging.info('channel "%s" of session "%s" of app "%s" cleared member.', id, session_id, app_id)

                self.response.out.write(Serializer.save({'result': "clear"}))
            else:
                self.response.out.write(Serializer.save({'result': 'Error', 'error': 'not authorized'}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionPostMessageHandler(webapp.RequestHandler):
    def post(self):
        #logging.info('arguments: %s', self.request.arguments())
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            current_user = users.get_current_user()
            if session.host == current_user:
                # post host message
                msg = SessionHostMessage(key_name = session.genNewHostMessageId(), parent = session)
                msg.data = self.request.get('data')
                msg.channels = self.request.get_all('channel')
                try:
                    msg.audiences = [users.User(email) for email in filter(lambda email: email, self.request.get_all('audience'))]
                except users.UserNotFoundError:
                    logging.error('UserNotFoundError, audiences: %s', self.request.get_all('audience'))
                msg.put()

                logging.info('a host(%s) message post in session "%s" of app "%s": %s %s %s', current_user.nickname(), session_id, app_id, msg.data,
                    msg.channels and ('via:%s' % msg.channels) or '', msg.audiences and ('to:%s' % [user.nickname() for user in msg.audiences]) or '')

                self.response.out.write(Serializer.save({'result': "OK", 'time': msg.time, 'id': msg.id()}))
            else:
                # post guest message
                msg = SessionGuestMessage(key_name = session.genNewGuestMessageId(), parent = session)
                msg.data = self.request.get('data')
                msg.sender = current_user
                msg.put()

                logging.info('a guest(%s) message post in session "%s" of app "%s": %s', current_user.nickname(), session_id, app_id, msg.data)

                self.response.out.write(Serializer.save({'result': "OK", 'time': msg.time}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))


class SessionFetchMessageHandler(webapp.RequestHandler):
    def get(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            warning = None
            if not session.alive:
                warning = 'session dead'

            if session.host == users.get_current_user():
                # fetch guest message
                start = int(self.request.str_GET.get('id', 0))
                next = session.next_guest_message_id

                messages = filter(lambda msg : msg, [SessionGuestMessage.get_by_key_name(str(id), session) for id in range(start, next)])

                self.response.out.write(Serializer.save({'next': next, 'messages': [msg.toDict() for msg in messages], 'warning': warning}))
            else:
                # fetch host message
                start = int(self.request.str_GET.get('id', 0))
                next = session.next_host_message_id

                messages = filter(lambda msg : msg and msg.isReceiver(users.get_current_user()), [SessionHostMessage.get_by_key_name(str(id), session) for id in range(start, next)])

                self.response.out.write(Serializer.save({'next': next, 'messages': [msg.toDict() for msg in messages], 'warning': warning}))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write(Serializer.save({'error': 'cannot find session'}))

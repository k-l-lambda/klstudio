
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
            self.response.out.write('{info={host=%s,setup_time=%s,alive_time=%s,alive=%s,next_host_message_id=%s,next_guest_message_id=%s,tags=%s}}'
                % Serializer.saveTuple(session.host, session.setup_time, session.alive_time, session.alive, session.next_host_message_id, session.next_guest_message_id, session.tags))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{error="cannot find session"}')


class SessionKeepAliveHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.alive_time = datetime.datetime.now()
                session.alive = True
                session.put()

                logging.info('session "%s" of app "%s" keep alive at %s.', id, app_id, session.alive_time)

                self.response.out.write('{result="OK",time="%s"}' % session.alive_time)
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionEndHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.alive = False
                session.put()

                logging.info('session "%s" of app "%s" end at %s.', id, app_id, datetime.datetime.now())

                self.response.out.write('{result="End"}')
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionSetTagsHandler(webapp.RequestHandler):
    def post(self):
        app_id, id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                session.tags = self.request.get_all('tag')
                session.put()

                logging.info('session "%s" of app "%s" set tags: %s.', id, app_id, session.tags)

                self.response.out.write('{result="OK"}')
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionChannelMembersHandler(webapp.RequestHandler):
    def get(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                self.response.out.write('{members=%s}' % Serializer.save(channel.members))
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{error="cannot find session"}')


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

                    self.response.out.write('{result="added"}')
                else:
                    self.response.out.write('{result="already exists"}')
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{result="Error",error="cannot find session"}')


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

                    self.response.out.write('{result="removed"}')
                else:
                    self.response.out.write('{result="not exists"}')
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionChannelClearMemberHandler(webapp.RequestHandler):
    def post(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user() or users.is_current_user_admin():
                id = re.sub('.*/channel/([^/]+)/.*', r'\1', self.request.path)
                channel = SessionChannel.getById(id, session)

                channel.members = []
                channel.put()

                logging.info('channel "%s" of session "%s" of app "%s" cleared member.', id, session_id, app_id)

                self.response.out.write('{result="clear"}')
            else:
                self.response.out.write('{result="Error",error="not authorized"}')
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionPostMessageHandler(webapp.RequestHandler):
    def post(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            current_user = users.get_current_user()
            if session.host == current_user:
                # post host message
                msg = SessionHostMessage(key_name = session.genNewHostMessageId(), parent = session)
                msg.data = self.request.get('data')
                msg.channels = self.request.get_all('channel')
                msg.audiences = [users.User(email) for email in self.request.get_all('audience')]
                msg.put()

                logging.info('a host(%s) message post in session "%s" of app "%s": %s %s %s', current_user.nickname(), session_id, app_id, msg.data,
                    msg.channels and ('via:%s' % msg.channels) or '', msg.audiences and ('to:%s' % [user.nickname() for user in msg.audiences]) or '')

                self.response.out.write('{result="OK",time="%s"}' % msg.time)
            else:
                # post guest message
                msg = SessionGuestMessage(key_name = session.genNewGuestMessageId(), parent = session)
                msg.data = self.request.get('data')
                msg.sender = current_user
                msg.put()

                logging.info('a guest(%s) message post in session "%s" of app "%s": %s', current_user.nickname(), session_id, app_id, msg.data)

                self.response.out.write('{result="OK",time="%s"}' % msg.time)
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{result="Error",error="cannot find session"}')


class SessionFetchMessageHandler(webapp.RequestHandler):
    def get(self):
        app_id, session_id, session = findSessionByPath(self.request.path)
        if session:
            if session.host == users.get_current_user():
                # fetch guest message
                start = int(self.request.str_GET.get('id', 0))
                next = session.next_guest_message_id

                messages = filter(lambda msg : msg, [SessionGuestMessage.get_by_key_name(str(id), session) for id in range(start, next)])

                self.response.out.write('{next=%s,messages=%s}' % Serializer.saveTuple(next, [dict([('data', Serializer.PlainText(msg.data)), ('time', msg.time), ('sender', msg.sender)]) for msg in messages]))
            else:
                # fetch host message
                start = int(self.request.str_GET.get('id', 0))
                next = session.next_host_message_id

                messages = filter(lambda msg : msg and msg.isReceiver(users.get_current_user()), [SessionHostMessage.get_by_key_name(str(id), session) for id in range(start, next)])

                self.response.out.write('{next=%s,messages=%s}' % Serializer.saveTuple(next, [dict([('data', Serializer.PlainText(msg.data)), ('time', msg.time)]) for msg in messages]))
        else:
            logging.error('cannot find session of "%s/%s"', app_id, session_id)
            self.response.out.write('{error="cannot find session"}')
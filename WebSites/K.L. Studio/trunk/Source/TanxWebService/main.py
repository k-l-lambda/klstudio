
import logging

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

from TanxWebService.ApplicationHandlers import *
from TanxWebService.SessionHandlers import *
import TanxWebService.Serializer


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('{result="hello!"}')

    def post(self):
        for arg in self.request.arguments():
            logging.info('%s: %s', arg, self.request.get(arg))


class UserInfoHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write(Serializer.save(users.get_current_user()))


def main():
    application = webapp.WSGIApplication([
        #('/tanx-web-service/[^/]*/',                                                        MainHandler),
        ('/tanx-web-service/[^/]*/user-info',                                               UserInfoHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/setup-session',                                 ApplicationSetupSessionHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session-list',                                  ApplicationSessionListHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/info',                            SessionInfoHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/keep-alive',                      SessionKeepAliveHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/end',                             SessionEndHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/set-tags',                        SessionSetTagsHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/post-message',                    SessionPostMessageHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/fetch-message',                   SessionFetchMessageHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/channel/[^/]*/members',           SessionChannelMembersHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/channel/[^/]*/add-member',        SessionChannelAddMemberHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/channel/[^/]*/remove-member',     SessionChannelRemoveMemberHandler),
        ('/tanx-web-service/[^/]*/app/[^/]*/session/[^/]*/channel/[^/]*/clear-member',      SessionChannelClearMemberHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

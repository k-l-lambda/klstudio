
import os
import logging

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template


class HomeHandler(webapp.RequestHandler):
    def get(self):
        template_values = {
            'current_user':             users.get_current_user(),
            'logout_url':               users.create_logout_url(self.request.uri),
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/Home.html')
        self.response.out.write(template.render(path, template_values))


class HostDialogHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/HostDialog.html')
        self.response.out.write(template.render(path, {}))


class GuestDialogHandler(webapp.RequestHandler):
    def get(self):
        id = self.request.str_GET.get('id') or ""
        host = self.request.str_GET.get('host') or ""

        path = os.path.join(os.path.dirname(__file__), 'templates/GuestDialog.html')
        self.response.out.write(template.render(path, {'dialog_parameters': '{id: "%s", host: "%s"}' % (id, host)}))


class RoomListHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/RoomList.html')
        self.response.out.write(template.render(path, {}))


class ContactsListHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/ContactsList.html')
        self.response.out.write(template.render(path, {}))


def main():
    application = webapp.WSGIApplication([
        ('/projects/ChatRoom/',                                     HomeHandler),
        ('/projects/ChatRoom/host-dialog',                          HostDialogHandler),
        ('/projects/ChatRoom/guest-dialog',                         GuestDialogHandler),
        ('/projects/ChatRoom/room-list',                            RoomListHandler),
        ('/projects/ChatRoom/contacts-list',                        ContactsListHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

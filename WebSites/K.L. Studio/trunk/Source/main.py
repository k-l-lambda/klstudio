
import os
import datetime
import re
import logging

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.redirect('/index.html')


class GuestNote(db.Model):
    author = db.UserProperty()
    remote_addr = db.StringProperty()
    content = db.StringProperty(multiline=True)
    date = db.DateTimeProperty(auto_now_add=True)


class MessageSign(webapp.RequestHandler):
    def post(self):
        note = GuestNote()

        if users.get_current_user():
            note.author = users.get_current_user()
        else:
            note.author = users.User(self.request.get('author'))

        note.remote_addr = self.request.remote_addr
        note.content = self.request.get('content')
        note.put()
        self.redirect('/MessageBoard')


class MessageBoard(webapp.RequestHandler):
    def get(self):
        notes = GuestNote.all().order('-date')
        user = users.get_current_user()

        template_values = {
            'author':       user and user.nickname() or 'anonymous guest',
            'logined':      user != None,
            'login_url':    users.create_login_url(self.request.uri),
            'notes':        notes,
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/MessageBoard.html')
        self.response.out.write(template.render(path, template_values))


class HtmlHandler(webapp.RequestHandler):
    def get(self):
        logging.info('self.request.path: %s', self.request.path)
        self.redirect('/%s?%s' % (re.sub('/html/(.*)', r'\1', self.request.path), self.request.query_string))


def main():
    application = webapp.WSGIApplication([
        ('/',                   MainHandler),
        ('/html/.*',            HtmlHandler),
        ('/MessageBoard',       MessageBoard),
        ('/MessageBoard/sign',  MessageSign),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

import os
import datetime
import re
import logging

from google.appengine.dist import use_library
try:
    use_library('django', '1.2')
except:
    logging.warn('use_library error: %s', sys.exc_info()[1])

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import mail


class HomeHandler(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
        self.response.out.write(template.render(path, {}))


class GuestNote(db.Model):
    author = db.UserProperty()
    remote_addr = db.StringProperty()
    user_agent = db.StringProperty()
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
        note.user_agent = self.request.headers['User-Agent']
        note.content = self.request.get('content')
        if users.get_current_user():
            note.put()

        mail.send_mail(
            sender = 'K.L.Studio.indiegame@gmail.com',
            to = 'K.L.Studio.indiegame@gmail.com',
            subject = 'A guest note signed on K.L. Studio message board',
            body = 'author: %s\nremote_addr: %s\nuser_agent: %s\nreferer: %s\ncontent: %s' % (note.author.email(), note.remote_addr, note.user_agent, self.request.headers['Referer'] or '', note.content)
        )

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
        ('/',                   HomeHandler),
        ('/html/.*',            HtmlHandler),
        ('/MessageBoard',       MessageBoard),
        ('/MessageBoard/sign',  MessageSign),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

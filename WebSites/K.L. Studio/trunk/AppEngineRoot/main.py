#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os
import datetime

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class MainHandler(webapp.RequestHandler):
    def get(self):
        #self.response.out.write('Hello world!')
        self.redirect('/html/index.html')


class GuestNote(db.Model):
    author = db.UserProperty()
    content = db.StringProperty(multiline=True)
    date = db.DateTimeProperty(auto_now_add=True)


class MessageSign(webapp.RequestHandler):
    def post(self):
        note = GuestNote()

        if users.get_current_user():
            note.author = users.get_current_user()
        else:
            note.author = users.User(self.request.get('author'))

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
        path = os.path.join(os.path.dirname(__file__), 'MessageBoard/template.html')
        self.response.out.write(template.render(path, template_values))


def main():
    application = webapp.WSGIApplication([
        ('/', MainHandler),
        ('/MessageBoard', MessageBoard),
        ('/MessageBoard/sign', MessageSign),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

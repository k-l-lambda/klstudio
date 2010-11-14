
import os
import logging

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

from TanxWebService.Application import *
from TanxWebService.ApplicationAdminHandlers import *


class AdminHomeHandler(webapp.RequestHandler):
    def get(self):
        applications = Application.all()

        template_values = {
            'applications':             applications,
        }
        path = os.path.join(os.path.dirname(__file__), 'templates/AdminHome.html')
        self.response.out.write(template.render(path, template_values))


class DeleteApplicationHandler(webapp.RequestHandler):
    def post(self):
        for id in self.request.get_all('id'):
            app = Application.get_by_key_name(id)
            app.deleteData()

        self.redirect('./')


class CreateApplicationHandler(webapp.RequestHandler):
    def post(self):
        id = self.request.get('id')
        app = Application(key_name = id)
        app.put()

        self.redirect('./')


def main():
    application = webapp.WSGIApplication([
        ('/tanx-web-service/[^/]*/admin/',                                      AdminHomeHandler),
        ('/tanx-web-service/[^/]*/admin/delete-app',                            DeleteApplicationHandler),
        ('/tanx-web-service/[^/]*/admin/create-app',                            CreateApplicationHandler),
        ('/tanx-web-service/[^/]*/admin/app/[^/]*/',                            ApplicationViewerHandler),
        ('/tanx-web-service/[^/]*/admin/app/[^/]*/delete-session',              DeleteSessionHandler),
        ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
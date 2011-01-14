
import sys
import logging
import re

from google.appengine.ext import webapp
from django.utils import simplejson
import gdata.service
import gdata.alt.appengine


class GdataQueryHandler(webapp.RequestHandler):
    def get(self):
        client = gdata.service.GDataService()
        gdata.alt.appengine.run_on_appengine(client)

        url = self.request.str_GET.get('url')
        try:
            response = client.Get(url, converter=str)
            self.response.out.write(response)
        except gdata.service.RequestError:
            logging.warn('Get gdata url failed: %s', url)
            self.response.out.write(simplejson.dumps({'error': str(sys.exc_info()[1])}))


class GdataAuthHandler(webapp.RequestHandler):
    def get(self):
        client = gdata.service.GDataService()
        gdata.alt.appengine.run_on_appengine(client)

        forward = self.request.str_GET.get('forward')
        if forward:
            auth_token = gdata.auth.extract_auth_sub_token_from_url(self.request.uri)
            if auth_token:
                #logging.info('auth_token: %s', auth_token)
                session_token = client.upgrade_to_session_token(auth_token)
                logging.info('session_token got: %s', session_token)

                client.token_store.add_token(session_token)
            else:
                logging.error('failed to extract auth_token from uri: %s', self.request.uri)

            self.redirect(forward)
        else:
            next = self.request.str_GET.get('next')
            scope = self.request.str_GET.get('scope')

            next_url = re.sub('(.*?)\?.*', r'\1?forward=%s', self.request.url) % next
            auth_url = client.GenerateAuthSubURL(next_url, (scope,), secure = False, session = True)

            logging.info('redirecting to auth_url: %s', auth_url)
            self.redirect(str(auth_url))

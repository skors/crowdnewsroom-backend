from django.test import TestCase

from django.urls import reverse
from unittest.mock import patch

from forms.models import User
from forms.tests.factories import FormResponseFactory


def url_for_response(response,
                     investigation_slug=None,
                     form_slug=None):
    form = response.form_instance.form
    investigation = form.investigation
    return reverse('response_details',
                   kwargs={"investigation_slug": investigation_slug or investigation.slug,
                           "form_slug": form_slug or form.slug,
                           "response_id": response.id})


class FormResponseDetailView(TestCase):
    def setUp(self):
        self.form_response_1 = FormResponseFactory.create()
        self.form_response_2 = FormResponseFactory.create()
        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')

    def test_returns_403_when_not_logged_in(self):
        url = url_for_response(self.form_response_1)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    @patch('webpack_loader.loader.WebpackLoader.get_bundle')
    def test_200_when_authorized(self, *args):
        self.client.login(email='admin@crowdnewsroom.org', password='password')

        url = url_for_response(self.form_response_1)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_404_when_not_existing(self):
        form_response = FormResponseFactory.create()
        url = url_for_response(form_response)
        # got URL but response will be deleted, so should 404 later
        form_response.delete()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_404_when_wrong_investigation(self):
        self.client.login(email='admin@crowdnewsroom.org', password='password')
        wrong_investigation = self.form_response_1.form_instance.form.investigation.slug
        response = self.client.get(url_for_response(self.form_response_2, investigation_slug=wrong_investigation))
        self.assertEqual(response.status_code, 404)
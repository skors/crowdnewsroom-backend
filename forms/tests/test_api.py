from unittest.mock import patch

from django.http import Http404
from django.test import TestCase, Client
from django.urls import reverse

from forms.admin_views import _get_file_data
from forms.models import User
from forms.tests.factories import FormResponseFactory


class APIFormReponseCreateTest(TestCase):
    def setUp(self):
        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')
        self.client = Client()
        self.client.login(email='admin@crowdnewsroom.org', password='password')
        self.response = FormResponseFactory.create()

    def test_get_not_allowed(self):
        form = self.response.form_instance.form
        url = reverse("form_response", kwargs={"investigation_slug": form.investigation.slug,
                                               "form_slug": form.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 405)


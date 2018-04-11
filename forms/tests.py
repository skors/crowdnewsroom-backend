from unittest.mock import PropertyMock, patch

import sys
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import activate

from forms.models import Investigation, UserGroup, FormResponse, generate_emails, Form, FormInstance, User
from forms.utils import _get_file_keys

activate("en")


class UserGroupTestCase(TestCase):
    def test_create_groups(self):
        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 0, "at the beginning there should be no groups")

        Investigation.objects.create(name="example investigation")

        user_groups = UserGroup.objects.all()
        self.assertEqual(len(user_groups), 5, "should create one group for each role")

    def test_formresponse_email(self):
        email_template = """
    Danke, dass sie bei WGHH mitgemacht haben!
    {% if response.send_report %}
    Sie finden Ihren personalisierten Report auf:
    https://wem-gehoert-hamburg.de/wem.html?street={{response.street | urlencode}}&nr={{response.house_number | urlencode}}
    {% endif %}
    Liebe Grüße,
    das WGHH Team
    """
        investigation = Investigation.objects.create(name="Example Investigation")
        form = Form.objects.create(name="My first Form", investigation=investigation)
        form_instance = FormInstance.objects.create(form=form,
                                                    form_json={},
                                                    email_template=email_template)
        response = FormResponse.objects.create(json={"email": "tester@example.com",
                                                     "send_report": True,
                                                     "street": "Große Singerstraße",
                                                     "house_number": "109",
                                                     },
                                               submission_date=timezone.now(),
                                               form_instance=form_instance,
                                               )

        email, html_email = generate_emails(response)
        expected = """
    Danke, dass sie bei WGHH mitgemacht haben!
    
    Sie finden Ihren personalisierten Report auf:
    https://wem-gehoert-hamburg.de/wem.html?street=Gro%C3%9Fe%20Singerstra%C3%9Fe&nr=109
    
    Liebe Grüße,
    das WGHH Team
    """
        self.assertEqual(email, expected)

    def test_formresponse_email_without_template(self):
        investigation = Investigation.objects.create(name="Example Investigation")
        form = Form.objects.create(name="My first Form", investigation=investigation)
        form_instance = FormInstance.objects.create(form=form,
                                                    form_json={})
        response = FormResponse.objects.create(json={"email": "tester@example.com",
                                                     "send_report": True,
                                                     "street": "Große Singerstraße",
                                                     "house_number": "109",
                                                     },
                                               submission_date=timezone.now(),
                                               form_instance=form_instance,
                                               )

        email, html_email = generate_emails(response)
        expected = "Thank you for participating in a crowdnewsroom investigation!"
        self.assertEqual(email, expected)

    def test_formresponse_email_fields(self):
        investigation = Investigation.objects.create(name="Example Investigation",
                                                     slug="example-investigation")
        form = Form.objects.create(name="My first Form",
                                   slug="my-first-form",
                                   investigation=investigation)
        form_instance = FormInstance.objects.create(form=form,
                                                    ui_schema_json={
                                                        "second-step": {
                                                            "signature": {
                                                                "ui:title": "Signature",
                                                                "ui:widget": "signatureWidget"
                                                            },
                                                            "get_updates": {
                                                                "ui:title": "Do you want updates?"
                                                            }
                                                        },
                                                        "first-step": {
                                                            "name": {
                                                                "ui:title": "Your name"
                                                            }
                                                        }
                                                    },
                                                    form_json=[
                                                        {
                                                            "schema": {
                                                                "type": "object",
                                                                "title": "First Step",
                                                                "slug": "first-step",
                                                                "properties": {
                                                                    "name": {
                                                                        "type": "string",
                                                                    }
                                                                }
                                                            },
                                                        },
                                                        {
                                                            "schema": {
                                                                "type": "object",
                                                                "title": "Second Step",
                                                                "slug": "second-step",
                                                                "properties": {
                                                                    "signature": {
                                                                        "type": "string"
                                                                    },
                                                                    "get_updates": {
                                                                        "type": "boolean"
                                                                    }
                                                                }
                                                            },
                                                        }]
                                                    )
        response = FormResponse.objects.create(json={
            "name": "Patrick",
            "signature": "data-url: abc",
            "get_updates": True,
        },
            submission_date=timezone.now(),
            form_instance=form_instance,
        )

        result = response.email_fields
        expected = """Your name: Patrick
Signature: <File>
Do you want updates?: Yes"""

        # starting from py3.6 we can actually assert
        # results to be in insertion order
        if sys.version_info[1] >= 6:
            self.assertEqual(result, expected)

        # we can always assert that at least the correct lines
        # are rendered (without taking order into account)
        self.assertEqual(sorted(result.split('\n')), sorted(expected.split('\n')))

    def test_formresponse_render_response_email(self):
        investigation = Investigation.objects.create(name="Example Investigation")
        form = Form.objects.create(name="My first Form",
                                   investigation=investigation)
        form_instance = FormInstance.objects.create(form=form,
                                                    form_json={},
                                                    email_template="""This is your response:
{{field_list}}"""
                                                    )
        with patch("forms.models.FormResponse.email_fields", new_callable=PropertyMock) as mock_email_fields:
            mock_email_fields.return_value = "<FIELDS>"
            response = FormResponse.objects.create(json={},
                                                   submission_date=timezone.now(),
                                                   form_instance=form_instance)
            email, html_email = generate_emails(response)

        expected = """This is your response:
<FIELDS>"""
        self.assertEqual(email, expected)


def url_for_response(response_id,
                     investigation_slug="first-investigation",
                     form_slug="first-form"):
    return reverse('response_details',
                   kwargs={"investigation_slug": investigation_slug,
                           "form_slug": form_slug,
                           "response_id": response_id})


def create_entries(name):
    investigation_name = "{} Investigation".format(name)
    investigation = Investigation.objects.create(name=investigation_name, slug=slugify(investigation_name))

    investigation_name = "{} Form".format(name)
    form = Form.objects.create(name=investigation_name,
                               slug=slugify(investigation_name),
                               investigation=investigation)
    form_instance = FormInstance.objects.create(form=form,
                                                form_json={})
    return FormResponse.objects.create(form_instance=form_instance,
                                       submission_date=timezone.now(),
                                       json={})


class FormResponseDetailView(TestCase):
    def setUp(self):
        self.form_response_1 = create_entries("First")
        self.form_response_2 = create_entries("Second")
        User.objects.create_superuser('admin@crowdnewsroom.org', 'password')

    def test_returns_403_when_not_logged_in(self):
        url = url_for_response(self.form_response_1.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_200_when_authorized(self):
        self.client.login(email='admin@crowdnewsroom.org', password='password')

        url = url_for_response(self.form_response_1.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_404_when_not_existing(self):
        NON_EXISTING_ID = 9999
        response = self.client.get(url_for_response(NON_EXISTING_ID))
        self.assertEqual(response.status_code, 404)

    def test_404_when_wrong_investigation(self):
        self.client.login(email='admin@crowdnewsroom.org', password='password')
        response = self.client.get(url_for_response(self.form_response_2.id, "first-investigation", "second-form"))
        self.assertEqual(response.status_code, 404)


class Utils(TestCase):
    def setUp(self):
        investigation_name = "First Investigation"
        investigation = Investigation.objects.create(name=investigation_name, slug=slugify(investigation_name))

        form_name = "First Form"
        self.form = Form.objects.create(name=form_name,
                                   slug=slugify(form_name),
                                   investigation=investigation)

    def test_get_file_keys_finds_file(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "string": {"type": "string"},
                                                                "file": {"type": "string",
                                                                         "format": "data-url"}
                                                            }
                                                        }
                                                    }])

        expected = {"file"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)


    def test_get_file_keys_finds_file_array(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "files": {
                                                                    "type": "array",
                                                                    "items": {
                                                                        "type": "string",
                                                                        "format": "data-url"
                                                                    }
                                                                },
                                                            }
                                                        }
                                                    }])

        expected = {"files"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)

    def test_get_file_keys_finds_signature(self):
        form_instance = FormInstance.objects.create(form=self.form,
                                                    form_json=[{
                                                        "schema": {
                                                            "slug": "first",
                                                            "properties": {
                                                                "signature": {"type": "string"},
                                                            }
                                                        }
                                                    }],
                                                    ui_schema_json={
                                                        "first": {
                                                            "signature": {
                                                                "ui:widget": "signatureWidget"
                                                            }
                                                        }
                                                    })

        expected = {"signature"}
        file_keys = _get_file_keys(form_instance)
        self.assertEqual(file_keys, expected)



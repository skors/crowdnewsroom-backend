import sys
from unittest.mock import patch, PropertyMock

from django.test import TestCase, override_settings
from django.utils import timezone

from forms.models import FormResponse, generate_emails
from forms.tests.factories import FormResponseFactory, FormInstanceFactory


@override_settings(LANGUAGE_CODE='en', LANGUAGES=(('en', 'English'),))
class EmailTestCase(TestCase):
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
        form_instance = FormInstanceFactory.create(email_template=email_template)
        response = FormResponseFactory.create(json={"email": "tester@example.com",
                                                     "send_report": True,
                                                     "street": "Große Singerstraße",
                                                     "house_number": "109",
                                                     },
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
        response = FormResponseFactory.create()

        email, html_email = generate_emails(response)
        expected = "Thank you for participating in a crowdnewsroom investigation!"
        self.assertEqual(email, expected)

    def test_formresponse_email_fields(self):
        form_instance = FormInstanceFactory.create(ui_schema_json={
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
        response = FormResponseFactory.create(json={
            "name": "Patrick",
            "signature": "data-url: abc",
            "get_updates": True,
        },
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
        form_instance = FormInstanceFactory.create(email_template="""This is your response:
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
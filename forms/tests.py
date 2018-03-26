from django.test import TestCase
from django.utils import timezone

from forms.models import Investigation, UserGroup, FormResponse, generate_email, Form, FormInstance


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

        email = generate_email(response)
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

        email = generate_email(response)
        expected = "Thank you for participating in a crowdnewsroom investigation!"
        self.assertEqual(email, expected)


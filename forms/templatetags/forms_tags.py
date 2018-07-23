from django import template
from django.core.exceptions import ObjectDoesNotExist

from forms.models import UserGroup

register = template.Library()


@register.simple_tag
def response_icon(status):
    icons = {
        "S": "fa-envelope",
        "V": "fa-check",
        "I": "fa-trash"
    }
    return icons.get(status, "fa-question")


@register.simple_tag
def user_role_for_investigation(user, investigation):
    try:
        user_group = UserGroup.objects.get(group__in=user.groups.all(),
                                           investigation=investigation)
        return user_group.role
    except ObjectDoesNotExist:
        return None

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsDemoOrAuthenticated(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class HasRole(BasePermission):
    roles = ()

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin" or user.is_superuser:
            return True
        return user.role in self.roles

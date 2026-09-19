from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import NotebookEntry
from .serializers import NotebookEntrySerializer


def _owned(user, pk):
    return NotebookEntry.objects.filter(user=user, pk=pk).first()


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def entries(request):
    if request.method == "GET":
        qs = NotebookEntry.objects.filter(user=request.user)
        t = request.query_params.get("type")
        if t in ("in", "out"):
            qs = qs.filter(type=t)
        return Response(NotebookEntrySerializer(qs, many=True).data)

    ser = NotebookEntrySerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    entry = NotebookEntry.objects.create(user=request.user, **ser.validated_data)
    return Response(NotebookEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def entry_detail(request, pk: int):
    entry = _owned(request.user, pk)
    if not entry:
        return Response(
            {"error": {"code": 404, "message": "Topilmadi", "fieldErrors": {}}},
            status=status.HTTP_404_NOT_FOUND,
        )
    if request.method == "GET":
        return Response(NotebookEntrySerializer(entry).data)
    if request.method == "DELETE":
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    ser = NotebookEntrySerializer(entry, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    for k, v in ser.validated_data.items():
        setattr(entry, k, v)
    entry.save()
    return Response(NotebookEntrySerializer(entry).data)

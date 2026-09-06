from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.goal_service import GoalService

class ClientGoalListCreateView(APIView):
    """
    GET  /api/clients/<client_id>/goals - List all goals for client (including shared goals)
    POST /api/clients/<client_id>/goals - Create a new goal for this client (supports shared_with)
    """
    def get(self, request, client_id):
        try:
            goals = GoalService.get_goals_for_client(client_id)
            return Response(goals, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, client_id):
        try:
            goal = GoalService.create_goal(client_id, request.data)
            return Response(goal, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GoalDetailView(APIView):
    """
    GET    /api/goals/<goal_id> - View goal details
    PUT    /api/goals/<goal_id> - Update goal
    PATCH  /api/goals/<goal_id> - Partially update goal
    DELETE /api/goals/<goal_id> - Delete goal
    """
    def get(self, request, goal_id):
        try:
            from crm.models import Goal
            goal = Goal.objects.get(id=goal_id)
            return Response(GoalService.serialize_goal(goal), status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, goal_id):
        try:
            updated = GoalService.update_goal(goal_id, request.data)
            return Response(updated, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, goal_id):
        return self.put(request, goal_id)

    def delete(self, request, goal_id):
        success = GoalService.delete_goal(goal_id)
        if success:
            return Response({"status": "deleted", "id": goal_id}, status=status.HTTP_200_OK)
        return Response({"error": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)

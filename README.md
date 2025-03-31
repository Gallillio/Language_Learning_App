# Language Learning App - Backend

This is the Django REST API backend for the Language Learning App, providing endpoints for stories, word bank management, user authentication, and learning statistics.

## Features

- User authentication (register, login, logout)
- Story management (create, read, update, delete)
- Word bank functionality (add, update, mark as learned)
- Learning statistics (user summary, activity history)
- Daily streak tracking

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```
   python manage.py migrate
   ```
5. Create a superuser:
   ```
   python manage.py createsuperuser
   ```
6. Run the development server:
   ```
   python manage.py runserver
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login and get token
- `POST /api/auth/logout/` - Logout and delete token
- `GET /api/auth/user/` - Get current user info
- `PUT /api/auth/update-goal/` - Update daily goal

### Stories

- `GET /api/stories/` - List all stories
- `POST /api/stories/` - Create new story
- `GET /api/stories/{id}/` - Get story details
- `PUT /api/stories/{id}/` - Update story
- `DELETE /api/stories/{id}/` - Delete story
- `POST /api/stories/{id}/add_to_library/` - Add story to user's library
- `GET /api/library/` - Get user's story library

### Word Bank

- `GET /api/words/` - List all user's words
- `POST /api/words/` - Add new word
- `GET /api/words/{id}/` - Get word details
- `PUT /api/words/{id}/` - Update word
- `DELETE /api/words/{id}/` - Delete word
- `GET /api/words/learning/` - Get words still being learned
- `GET /api/words/mastered/` - Get mastered words
- `POST /api/words/{id}/mark_as_learned/` - Mark word as learned
- `POST /api/words/{id}/unmark_as_learned/` - Unmark word as learned
- `POST /api/words/{id}/update_confidence/` - Update confidence level

### Statistics

- `GET /api/stats/user_summary/` - Get user's learning statistics summary
- `GET /api/stats/activity_history/` - Get user's learning activity history

## License

This project is licensed under the MIT License.

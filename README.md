# UpNext

UpNext is a lightweight team task-management web app built for the Software Cloud Computing Course.  
It works like a simplified Jira/Trello system where managers create projects, assign tasks to employees, and teams track work on a Kanban board.

## Features

- User authentication with AWS Cognito
- Manager and employee roles
- Team-based task visibility
- Project and task management
- Kanban board: To Do, In Progress, In Review, Done
- Task comments
- Image attachments stored in S3
- Image resizing with Lambda
- Task assignment notifications using SNS and SQS
- Daily task digest using EventBridge
- Monitoring with CloudWatch
- Final deployment using EC2, ALB, Auto Scaling Group, and CloudFront

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- AWS SDK for JavaScript

### AWS
- Cognito
- DynamoDB
- S3
- Lambda
- SNS
- SQS
- EventBridge
- CloudWatch
- EC2
- ALB
- Auto Scaling Group
- CloudFront

## Project Structure

```text
upnext/
  backend/
  frontend/
  lambdas/
  docs/
  README.md

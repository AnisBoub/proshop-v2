pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = "proshop-backend:latest"
        DOCKER_IMAGE_FRONTEND = "proshop-frontend:latest"
    }

    stages {
        stage('Informations') {
            steps {
                echo '===== Informations ====='
                sh 'pwd'
                sh 'ls -la'
            }
        }

        stage('Docker Test') {
            steps {
                echo '===== Verification Docker ====='
                sh 'docker --version'
                sh 'docker ps'
            }
        }

        stage('Build Backend') {
            steps {
                echo '===== Build Backend ====='
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND} -f backend/Dockerfile .'
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} frontend/'
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                sh 'docker compose down --volumes --remove-orphans'
                sh 'mkdir -p prometheus'
                sh 'docker compose up -d --force-recreate'
                
                sleep time: 15, unit: 'SECONDS'
                
                sh 'docker compose exec -T backend node backend/seeder.js'
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                sh 'docker ps'
                echo '----- Services Docker Compose -----'
                sh 'docker compose ps'
            }
        }
    }

    post {
        success {
            echo '================================='
            echo 'PIPELINE EXECUTE AVEC SUCCES'
            echo '================================='
            echo 'Frontend   : http://localhost:3000'
            echo 'Backend    : http://localhost:5000'
        }
        failure {
            echo '================================='
            echo 'ECHEC DU PIPELINE JENKINS'
            echo '================================='
        }
    }
}
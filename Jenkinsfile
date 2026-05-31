pipeline {
    agent any

    stages {
        stage('Informations') {
            steps {
                echo '===== Informations ====='
                sh 'pwd && ls -la'
            }
        }

        stage('Build Backend') {
            steps {
                echo '===== Build Backend ====='
                // On build directement là où Jenkins a cloné le code, sans passer par Windows
                sh 'docker build -t proshop-backend:latest -f backend/Dockerfile .'
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                sh 'docker build -t proshop-frontend:latest frontend/'
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                sh '''
                docker compose down || true
                docker compose up -d
                '''
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                sh '''
                docker ps
                echo "--- Statut des services Compose ---"
                docker compose ps
                '''
            }
        }
    }

    post {
        success {
            echo '================================='
            echo 'PIPELINE EXECUTE AVEC SUCCES'
            echo '================================='
        }
        failure {
            echo '================================='
            echo 'ECHEC DU PIPELINE'
            echo '================================='
        }
    }
}
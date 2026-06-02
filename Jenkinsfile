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
                sh 'pwd' [cite: 2]
                sh 'ls -la' [cite: 2]
            }
        }

        stage('Docker Test') {
            steps {
                echo '===== Verification Docker ====='
                sh 'docker --version' [cite: 3]
                sh 'docker ps' [cite: 3]
            }
        }

        stage('Build Backend') {
            steps {
                echo '===== Build Backend ====='
                // Force le build propre de l'image de Jenkins
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND} -f backend/Dockerfile .'
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                // Force le build propre de l'image de Jenkins
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} frontend/'
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                // Arrêt des conteneurs précédents et nettoyage complet des volumes
                sh 'docker compose down --volumes --remove-orphans' [cite: 7]
                
                sh 'mkdir -p prometheus' [cite: 7]
                
                // ============================================================
                // CORRECTION CRITIQUE : Retrait du flag --build
                // On force l'utilisation stricte des images créées ci-dessus
                // ============================================================
                sh 'docker compose up -d --force-recreate'
                
                sleep time: 15, unit: 'SECONDS' [cite: 8]
                
                sh 'docker compose exec -T backend node backend/seeder.js' [cite: 9]
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                sh 'docker ps' [cite: 10]
                echo '----- Services Docker Compose -----'
                sh 'docker compose ps' [cite: 10]
            }
        }
    }

    post {
        success {
            echo '=================================' [cite: 12]
            echo 'PIPELINE EXECUTE AVEC SUCCES' [cite: 12]
            echo '=================================' [cite: 12]
            echo 'Frontend   : http://localhost:3000' [cite: 12]
            echo 'Backend    : http://localhost:5000' [cite: 12]
        }
        failure {
            echo '=================================' [cite: 13]
            echo 'ECHEC DU PIPELINE JENKINS' [cite: 13]
            echo '=================================' [cite: 13]
        }
    }
}
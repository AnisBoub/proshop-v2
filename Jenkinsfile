pipeline {
    agent any

    environment {
        // Définition des variables d'environnement globales
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
                // Ajout de --no-cache pour forcer l'inclusion du server.js corrigé (0.0.0.0)
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND} -f backend/Dockerfile .'
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                // Maintien du --no-cache pour l'inclusion du nginx.conf
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} frontend/'
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                // Arrêt des conteneurs précédents, nettoyage des volumes et des orphelins
                sh 'docker compose down --volumes --remove-orphans'
                
                // Préparation du dossier prometheus si nécessaire
                sh 'mkdir -p prometheus'
                
                // Lancement de l'architecture Docker Compose
                sh 'docker compose up -d --force-recreate'
                
                // Attente pour s'assurer que la base MongoDB et Node.js soient prêts
                sleep time: 15, unit: 'SECONDS'
                
                // Exécution du script de peuplement de la base de données (Seeder)
                sh 'docker compose exec -T backend node backend/seeder.js'
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                // Vérification de l'état général des conteneurs système
                sh 'docker ps'
                echo '----- Services Docker Compose -----'
                sh 'docker compose ps'
                echo '----- Verification fichiers -----'
                sh 'ls -R'
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
            echo 'MongoDB    : localhost:27017'
            echo 'Prometheus : http://localhost:9090'
            echo 'Grafana    : http://localhost:3001'
        }
        failure {
            echo '================================='
            echo 'ECHEC DU PIPELINE JENKINS'
            echo '================================='
        }
    }
}
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
                // CORRECTION : Ajout de --no-cache pour forcer l'inclusion du server.js corrigé (0.0.0.0)
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_BACKEND} -f backend/Dockerfile .' [cite: 4]
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                // Maintien du --no-cache pour l'inclusion du nginx.conf corrigé
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} frontend/' [cite: 6]
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                // Arrêt des conteneurs précédents, nettoyage des volumes et des orphelins
                sh 'docker compose down --volumes --remove-orphans' [cite: 7]
                
                // Préparation du dossier prometheus si nécessaire
                sh 'mkdir -p prometheus' [cite: 7]
                
                // Lancement de l'architecture Docker Compose (va lier nos images fraîchement créées sans cache)
                sh 'docker compose up -d --force-recreate' [cite: 8]
                
                // Attente pour s'assurer que la base MongoDB et Node.js soient prêts
                sleep time: 15, unit: 'SECONDS' [cite: 8]
                
                // Exécution du script de peuplement de la base de données (Seeder)
                sh 'docker compose exec -T backend node backend/seeder.js' [cite: 9]
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification =====' [cite: 10]
                // Vérification de l'état général des conteneurs système
                sh 'docker ps' [cite: 10]
                echo '----- Services Docker Compose -----' [cite: 10]
                sh 'docker compose ps' [cite: 10]
                echo '----- Verification fichiers -----' [cite: 11]
                sh 'ls -R' [cite: 11]
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
            echo 'MongoDB    : localhost:27017' [cite: 12]
            echo 'Prometheus : http://localhost:9090' [cite: 12]
            echo 'Grafana    : http://localhost:3001' [cite: 13]
        }
        failure {
            echo '================================='
            echo 'ECHEC DU PIPELINE JENKINS'
            echo '================================='
        }
    }
}
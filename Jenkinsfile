pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = "proshop-backend:latest"
        DOCKER_IMAGE_FRONTEND = "proshop-frontend:latest"
        DOCKER_COMPOSE_FILE   = "docker-compose.yml"
    }

    stages {
        stage('Informations') {
            steps {
                echo '===== Informations ====='
                sh 'pwd'
                sh 'ls -la'
                sh 'echo "Git Branch: ${GIT_BRANCH}"'
                sh 'echo "Build Number: ${BUILD_NUMBER}"'
            }
        }

        stage('Docker Test') {
            steps {
                echo '===== Verification Docker ====='
                sh 'docker --version'
                sh 'docker ps'
                sh 'docker compose version'
            }
        }

        stage('Debug Frontend Context') {
            steps {
                echo '===== Debug Frontend Build Context ====='
                sh 'ls -la frontend/'
                sh 'test -f frontend/nginx.conf && echo "✅ nginx.conf existe" || echo "❌ nginx.conf manque"'
                sh 'cat frontend/Dockerfile'
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
                script {
                    if (fileExists('frontend/nginx.conf')) {
                        echo '✅ nginx.conf trouvé - Build en cours...'
                        sh 'cat frontend/nginx.conf | head -10'
                    } else {
                        echo '⚠️  nginx.conf non trouvé - Build sans configuration personnalisée'
                    }
                }
                // Build depuis la racine avec contexte complet
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} -f frontend/Dockerfile .'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo '===== Arret des anciens conteneurs ====='
                script {
                    try {
                        sh 'docker compose down --volumes --remove-orphans'
                    } catch (Exception e) {
                        echo "Aucun conteneur existant ou erreur ignorée: ${e.message}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                
                // Créer le dossier prometheus s'il n'existe pas
                sh 'mkdir -p prometheus'
                
                // Démarrer les services
                sh 'docker compose up -d --force-recreate'
                
                // Attendre que les services soient prêts
                echo 'Attente du démarrage des services...'
                sleep time: 30, unit: 'SECONDS'
            }
        }

        stage('Database Seeding') {
            steps {
                echo '===== Seed de la base de données ====='
                script {
                    try {
                        // Vérifier si le conteneur backend est en cours d'exécution
                        def backendRunning = sh(script: 'docker ps -q -f name=backend', returnStdout: true).trim()
                        
                        if (backendRunning) {
                            // Attendre que le backend soit prêt
                            echo 'Attente que le backend soit disponible...'
                            sh 'timeout 60 bash -c \'while ! curl -s http://localhost:5000/api/products > /dev/null; do sleep 2; done\''
                            
                            // Exécuter le seeder
                            sh 'docker compose exec -T backend node backend/seeder.js'
                            echo '✅ Seed execute avec succes'
                        } else {
                            echo '⚠️  Conteneur backend non trouvé, skipping seed'
                        }
                    } catch (Exception e) {
                        echo "Erreur lors du seeding: ${e.message}"
                        // Ne pas faire échouer le pipeline pour une erreur de seeding
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                sh 'docker ps'
                echo '----- Services Docker Compose -----'
                sh 'docker compose ps'
                echo '----- Tests de connectivite -----'
                script {
                    try {
                        echo 'Test Backend API...'
                        sh 'curl -s http://localhost:5000/api/products | head -c 200 || echo "Backend non disponible"'
                        echo ''
                        echo 'Test Frontend...'
                        sh 'curl -s http://localhost:3000 | head -c 200 || echo "Frontend non disponible"'
                        echo ''
                    } catch (Exception e) {
                        echo "Erreur lors des tests: ${e.message}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '================================='
            echo '✅ PIPELINE EXECUTE AVEC SUCCES'
            echo '================================='
            echo 'Frontend   : http://localhost:3000'
            echo 'Backend    : http://localhost:5000'
            echo 'Prometheus : http://localhost:9090'
            echo '================================='
        }
        failure {
            echo '================================='
            echo '❌ ECHEC DU PIPELINE JENKINS'
            echo '================================='
            echo 'Erreur pendant le pipeline. Verifiez les logs ci-dessus.'
            
            // Afficher les logs Docker pour debug
            script {
                try {
                    echo '----- DERNIERS LOGS DOCKER -----'
                    sh 'docker compose logs --tail=50'
                } catch (Exception e) {
                    echo "Impossible d obtenir les logs: ${e.message}"
                }
            }
        }
        always {
            echo '===== Fin du pipeline ====='
            // Nettoyage optionnel (décommentez si nécessaire)
            // sh 'docker system prune -f'
        }
    }
}
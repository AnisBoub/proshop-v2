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
                sh 'echo "Git Branch: ${GIT_BRANCH}"'
                sh 'echo "Build Number: ${BUILD_NUMBER}"'
                sh 'echo "Build ID: ${BUILD_ID}"'
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
                sh 'head -20 frontend/Dockerfile'
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
                    } else {
                        echo '⚠️  nginx.conf non trouvé - Build sans configuration personnalisée'
                    }
                }
                sh 'docker build --no-cache -t ${DOCKER_IMAGE_FRONTEND} -f frontend/Dockerfile .'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo '===== Arret des anciens conteneurs ====='
                script {
                    try {
                        sh 'docker compose down --volumes --remove-orphans || true'
                    } catch (Exception e) {
                        echo "Aucun conteneur existant ou erreur ignorée: ${e.message}"
                    }
                }
            }
        }

        stage('Prepare Prometheus Config') {
            steps {
                echo '===== Preparation de la configuration Prometheus ====='
                script {
                    sh '''
                        # Nettoyer l'ancienne configuration si corrompue
                        if [ -d "prometheus/prometheus.yml" ]; then
                            echo "⚠️  Suppression du dossier prometheus.yml corrompu..."
                            rm -rf prometheus/prometheus.yml
                        fi
                        
                        # Créer le dossier prometheus
                        mkdir -p prometheus
                        
                        # Créer le fichier prometheus.yml avec la configuration complète
                        cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'proshop-backend'
    scrape_interval: 5s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:5000']
EOF
                        
                        # Vérifier que c'est bien un fichier
                        if [ -f "prometheus/prometheus.yml" ]; then
                            echo "✅ prometheus.yml est un fichier valide"
                            ls -la prometheus/prometheus.yml
                        else
                            echo "❌ Erreur: prometheus.yml n'est pas un fichier"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                sh 'docker compose up -d --force-recreate'
                
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
                            echo 'Attente que le backend soit disponible...'
                            sh 'timeout 60 bash -c \'while ! curl -s http://localhost:5000/api/products > /dev/null; do sleep 2; done\''
                            
                            echo 'Execution du seeder...'
                            sh 'docker compose exec -T backend node backend/seeder.js'
                            echo '✅ Seed execute avec succes'
                        } else {
                            echo '⚠️  Conteneur backend non trouvé, skipping seed'
                        }
                    } catch (Exception e) {
                        echo "⚠️  Erreur lors du seeding: ${e.message}"
                        echo 'Le seeding a échoué mais le pipeline continue...'
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification des services ====='
                sh 'docker ps'
                echo ''
                echo '----- Services Docker Compose -----'
                sh 'docker compose ps'
                echo ''
                echo '----- Tests de connectivite -----'
                script {
                    try {
                        echo 'Test Backend API...'
                        def backendTest = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/products', returnStdout: true).trim()
                        if (backendTest == '200') {
                            echo '✅ Backend API: OK (HTTP 200)'
                        } else {
                            echo "⚠️  Backend API: HTTP ${backendTest}"
                        }
                        
                        echo ''
                        echo 'Test Frontend...'
                        def frontendTest = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', returnStdout: true).trim()
                        if (frontendTest == '200') {
                            echo '✅ Frontend: OK (HTTP 200)'
                        } else {
                            echo "⚠️  Frontend: HTTP ${frontendTest}"
                        }
                        
                        echo ''
                        echo 'Test Prometheus...'
                        def promTest = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:9090', returnStdout: true).trim()
                        if (promTest == '200') {
                            echo '✅ Prometheus: OK (HTTP 200)'
                        } else {
                            echo "⚠️  Prometheus: HTTP ${promTest}"
                        }
                    } catch (Exception e) {
                        echo "Erreur lors des tests: ${e.message}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo '✅ PIPELINE EXECUTE AVEC SUCCES'
            echo '=========================================='
            echo '📍 Frontend   : http://localhost:3000'
            echo '📍 Backend    : http://localhost:5000'
            echo '📍 Prometheus : http://localhost:9090'
            echo '=========================================='
            echo '📝 API Endpoints:'
            echo '   - GET  /api/products'
            echo '   - GET  /api/users'
            echo '   - POST /api/users/login'
            echo '=========================================='
        }
        
        failure {
            echo '=========================================='
            echo '❌ ECHEC DU PIPELINE JENKINS'
            echo '=========================================='
            echo 'Erreur pendant le pipeline. Verifiez les logs ci-dessus.'
            echo ''
            echo 'Debug - Derniers logs Docker:'
            script {
                try {
                    sh 'echo "----- Logs MongoDB -----"'
                    sh 'docker compose logs mongo --tail=20 || echo "MongoDB logs non disponibles"'
                    sh 'echo ""'
                    sh 'echo "----- Logs Backend -----"'
                    sh 'docker compose logs backend --tail=20 || echo "Backend logs non disponibles"'
                    sh 'echo ""'
                    sh 'echo "----- Logs Frontend -----"'
                    sh 'docker compose logs frontend --tail=20 || echo "Frontend logs non disponibles"'
                    sh 'echo ""'
                    sh 'echo "----- Logs Prometheus -----"'
                    sh 'docker compose logs prometheus --tail=20 || echo "Prometheus logs non disponibles"'
                } catch (Exception e) {
                    echo "Impossible d obtenir les logs: ${e.message}"
                }
            }
            echo '=========================================='
        }
        
        always {
            echo '===== Fin du pipeline ====='
            // Nettoyage des images docker non utilisées (optionnel)
            // sh 'docker image prune -f'
        }
    }
}
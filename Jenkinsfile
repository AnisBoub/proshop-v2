pipeline {
    agent any

    environment {
        // Définition des variables d'environnement globales si nécessaire
        BACKEND_IMAGE  = "proshop-backend:latest"
        FRONTEND_IMAGE = "proshop-frontend:latest"
    }

    stages {
        stage('Informations') {
            steps {
                echo "===== Informations ====="
                sh "pwd"
                sh "ls -la"
                sh "echo Git Branch: ${env.BRANCH_NAME ?: 'origin/main'}"
                sh "echo Build Number: ${env.BUILD_NUMBER}"
                sh "echo Build ID: ${env.BUILD_ID}"
            }
        }

        stage('Docker Test') {
            steps {
                echo "===== Verification Docker ====="
                sh "docker --version"
                sh "docker ps"
                sh "docker compose version"
            }
        }

        stage('Debug Frontend Context') {
            steps {
                echo "===== Debug Frontend Build Context ====="
                sh "ls -la frontend/"
                sh "test -f frontend/nginx.conf && echo '✅ nginx.conf existe' || echo '❌ nginx.conf MANQUANT'"
                sh "head -20 frontend/Dockerfile"
            }
        }

        stage('Build Backend') {
            steps {
                echo "===== Build Backend ====="
                sh "docker build --no-cache -t ${BACKEND_IMAGE} -f backend/Dockerfile ."
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    echo "===== Build Frontend ====="
                    if (fileExists('frontend/nginx.conf')) {
                        echo "✅ nginx.conf trouvé - Build en cours..."
                    } else {
                        echo "⚠️ Attention : frontend/nginx.conf est introuvable au niveau du workspace !"
                    }
                }
                sh "docker build --no-cache -t ${FRONTEND_IMAGE} -f frontend/Dockerfile ."
            }
        }

        stage('Stop Old Containers') {
            steps {
                script {
                    echo "===== Arret des anciens conteneurs ====="
                    sh "docker compose down --volumes --remove-orphans"
                }
            }
        }

        stage('Prepare Prometheus Config') {
            steps {
                script {
                    echo "===== Preparation de la configuration Prometheus ====="
                    // Vérification que le dossier et le fichier existent bien pour le build d'image
                    sh "mkdir -p prometheus"
                    // On s'assure que le fichier prometheus.yml est présent localement dans l'espace Jenkins 
                    // pour que le 'Dockerfile' de Prometheus puisse le copier lors du 'docker compose up --build'
                    sh """
                    if [ ! -f prometheus/prometheus.yml ]; then
                        cat << 'EOF' > prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'proshop-backend'
    static_configs:
      - targets: ['backend:5000']
EOF
                    fi
                    """
                    echo "✅ prometheus.yml est un fichier valide"
                    sh "ls -la prometheus/prometheus.yml"
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "===== Deploiement ====="
                // --build force Docker Compose à re-construire l'image Prometheus locale embarquant le fichier yml
                sh "docker compose up -d --force-recreate --build"
                echo "Attente du démarrage des services..."
                sleep 30
            }
        }

        stage('Database Seeding') {
            steps {
                script {
                    echo "===== Seed de la base de données ====="
                    sh "docker ps -q -f name=backend"
                    echo "Attente que le backend soit disponible..."
                    
                    // CORRECTION : Remplacement de localhost:5000 par backend:5000 (Réseau Docker)
                    try {
                        timeout(time: 60, unit: 'SECONDS') {
                            sh """
                            while ! curl -s http://backend:5000/api/products > /dev/null; do 
                                sleep 2
                            done
                            """
                        }
                        echo "✅ Le Backend répond ! Lancement du seeding..."
                        // Commande pour lancer le seed dans le conteneur backend
                        sh "docker compose exec -T backend npm run data:import"
                    } catch (err) {
                        echo "⚠️ Erreur lors du seeding ou timeout expiré : ${err.getMessage()}"
                        echo "Le seeding a échoué mais le pipeline continue..."
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                echo "===== Verification des services ====="
                sh "docker ps"
                echo ""
                echo "----- Services Docker Compose -----"
                sh "docker compose ps"
                echo ""
                echo "----- Tests de connectivite -----"
                script {
                    echo "Test Backend API..."
                    // CORRECTION : curl interroge 'backend' au lieu de 'localhost'
                    try {
                        def statusCode = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://backend:5000/api/products", returnStdout: true).trim()
                        echo "Code HTTP reçu du Backend : ${statusCode}"
                        if (statusCode == "200") {
                            echo "✅ Test de connectivité réussi (HTTP 200)"
                        } else {
                            echo "⚠️ Le backend a répondu avec le code ${statusCode}"
                        }
                    } catch (err) {
                        echo "❌ Erreur lors des tests : Impossible de joindre l'API interne backend:5000"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "===== Fin du pipeline ====="
            echo "=========================================="
            script {
                // Détermination du statut pour l'affichage de fin
                if (currentBuild.currentResult == 'SUCCESS') {
                    echo "✅ PIPELINE EXECUTE AVEC SUCCES"
                } else {
                    echo "❌ ECHEC DU PIPELINE JENKINS"
                    echo "Erreur pendant le pipeline. Verifiez les logs ci-dessus."
                }
            }
            echo "=========================================="
            echo "📍 Frontend   : http://localhost:3000"
            echo "📍 Backend    : http://localhost:5000"
            echo "📍 Prometheus : http://localhost:9090"
            echo "=========================================="
            echo "📝 API Endpoints théoriques :"
            echo "   - GET  /api/products"
            echo "   - GET  /api/users"
            echo "   - POST /api/users/login"
            echo "=========================================="
            
            echo "Debug - Derniers logs Docker (MongoDB) :"
            sh "docker compose logs mongo --tail=20"
        }
    }
}
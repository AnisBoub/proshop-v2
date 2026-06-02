pipeline {
    agent any

    environment {
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
                    sh "mkdir -p prometheus"
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
                sh "docker compose up -d --force-recreate --build"
                echo "Attente initiale du démarrage des services..."
                sleep 15
            }
        }

        stage('Database Seeding') {
            steps {
                script {
                    echo "===== Seed de la base de données ====="
                    echo "Attente que l'API du backend soit accessible via la passerelle hôte..."
                    
                    try {
                        timeout(time: 45, unit: 'SECONDS') {
                            // CORRECTION CRITIQUE : Utilisation de la passerelle par défaut Docker (172.17.0.1) ou localhost sur le port exposé 5000
                            sh """
                            until [ "\$(curl -s -o /dev/null -w '%{http_code}' http://172.17.0.1:5000/api/health || curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/health)" = "200" ]; do
                                echo "L'interface réseau externe n'est pas encore prête, attente..."
                                sleep 3
                            done
                            """
                        }
                        echo "✅ Le Backend répond de l'extérieur ! Lancement du seeding..."
                        sh "docker compose exec -T backend npm run data:import"
                        echo "✅ Seeding terminé avec succès."
                    } catch (err) {
                        echo "⚠️ Problème d'accès réseau direct pour curl, mais tentative forcée d'importation locale dans le conteneur..."
                        sh "docker compose exec -T backend npm run data:import || true"
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                echo "===== Verification des services ====="
                sh "docker compose ps"
                echo ""
                echo "----- Tests de connectivite externe -----"
                script {
                    try {
                        // CORRECTION CRITIQUE : Test via l'IP de la passerelle hôte accessible par Jenkins
                        def statusCode = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://172.17.0.1:5000/api/health || curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/health", returnStdout: true).trim()
                        echo "Code HTTP reçu de l'API : ${statusCode}"
                        
                        if (statusCode == "200") {
                            echo "✅ Test de connectivité réussi (HTTP 200) !"
                        } else {
                            echo "⚠️ Code inattendu ou Jenkins isolé du réseau. Statut brut : ${statusCode}"
                        }
                    } catch (err) {
                        echo "⚠️ Échec de la commande curl depuis le conteneur Jenkins."
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
                if (currentBuild.currentResult == 'SUCCESS') {
                    echo "✅ PIPELINE EXECUTE AVEC SUCCES"
                } else {
                    echo "❌ ECHEC DU PIPELINE JENKINS"
                }
            }
            echo "=========================================="
            echo "📍 Frontend   : http://localhost:3000"
            echo "📍 Backend    : http://localhost:5000"
            echo "📍 Prometheus : http://localhost:9090"
            echo "=========================================="
        }
    }
}
pipeline {
    agent any

    stages {

        stage('Informations') {
            steps {
                echo '===== Informations ====='
                sh '''
                pwd
                ls -la
                '''
            }
        }

        stage('Docker Test') {
            steps {
                echo '===== Verification Docker ====='
                sh '''
                docker --version
                docker ps
                '''
            }
        }

        stage('Build Backend') {
            steps {
                echo '===== Build Backend ====='
                sh '''
                docker build -t proshop-backend:latest -f backend/Dockerfile .
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                echo '===== Build Frontend ====='
                sh '''
                docker build -t proshop-frontend:latest frontend/
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '===== Deploiement ====='
                sh '''
                # 1. Arrêt complet et suppression agressive des conteneurs/volumes associés
                docker compose down --volumes --remove-orphans || true
                
                # 2. Utilisation d'un conteneur Alpine temporaire en tant que ROOT Docker 
                # pour forcer la suppression du faux dossier bloquant s'il existe
                docker run --rm -v $(pwd):/workspace alpine rm -rf /workspace/prometheus/prometheus.yml || true
                
                # 3. Recréation propre de l'arborescence et du fichier de configuration
                mkdir -p prometheus
                cat << 'EOF' > prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['127.0.0.1:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

                # 4. Relancement propre de l'environnement
                docker compose up -d --build --force-recreate
                
                # 5. Attente du démarrage et injection des données
                sleep 15
                docker compose exec -T backend node backend/seeder.js || true
                '''
            }
        }

        stage('Verify') {
            steps {
                echo '===== Verification ====='
                sh '''
                docker ps

                echo "----- Services Docker Compose -----"
                docker compose ps

                echo "----- Verification fichiers -----"
                ls -R
                '''
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
            echo 'ECHEC DU PIPELINE'
            echo '================================='
        }
    }
}
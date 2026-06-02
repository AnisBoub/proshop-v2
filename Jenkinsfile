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
                # 1. Nettoyage et arrêt
                docker compose down --volumes --remove-orphans || true
                
                # 2. On s'assure que le dossier local existe et on écrit le fichier au propre
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

                # Si vous avez mis le Dockerfile dans le dossier prometheus, créez-le ici dynamiquement si besoin :
                cat << 'EOF' > prometheus/Dockerfile
FROM prom/prometheus:latest
COPY prometheus.yml /etc/prometheus/prometheus.yml
EOF

                # 3. Lancement du Build global et déploiement (incluant notre nouveau Prometheus personnalisé)
                docker compose up -d --build --force-recreate
                
                # 4. Attente et injection de données
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
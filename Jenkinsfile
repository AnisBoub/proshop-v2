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
                # 1. Arrêt propre des conteneurs
                docker compose down --volumes || true
                
                # 2. Nettoyage du faux dossier créé par erreur et réécriture propre du fichier
                if [ -d "prometheus/prometheus.yml" ]; then
                    rm -rf prometheus/prometheus.yml
                fi
                
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

                # 3. Lancement de l'application
                docker compose up -d --build --force-recreate
                
                # 4. Attente et injection des données de test
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
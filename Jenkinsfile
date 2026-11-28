
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    environment {
        IMAGE = 'anatabudiayuni/kirimcepat'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.TAG = bat(
                        script: '@git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Test') {
            steps {
                bat 'docker build --no-cache --target test -t kirimcepat-test:%TAG% .'
            }
        }

        stage('Build Image') {
            steps {
                bat 'docker build --target prod -t %IMAGE%:%TAG% .'
            }
        }

        stage('Push Image') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    script {
                        try {
                            bat '''
                                @echo off
                                powershell -NoProfile -Command "$env:DOCKER_TOKEN | docker login --username $env:DOCKER_USER --password-stdin; exit $LASTEXITCODE"
                                if errorlevel 1 exit /b 1

                                docker tag %IMAGE%:%TAG% %IMAGE%:latest
                                if errorlevel 1 exit /b 1

                                docker push %IMAGE%:%TAG%
                                if errorlevel 1 exit /b 1

                                docker push %IMAGE%:latest
                            '''
                        } finally {
                            bat 'docker logout'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    file(
                        credentialsId: 'kirimcepat-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    script {
                        try {
                            bat '''
                                @echo off
                                copy /Y "%ENV_FILE%" .env >nul
                                if errorlevel 1 exit /b 1

                                docker compose pull app
                                if errorlevel 1 exit /b 1

                                docker compose up -d
                            '''
                        } finally {
                            bat 'if exist .env del /q .env'
                        }
                    }
                }
            }
        }

        stage('Smoke Test') {
            when {
                branch 'main'
            }
            steps {
                retry(12) {
                    sleep time: 10, unit: 'SECONDS'
                    bat '''
                        powershell -NoProfile -Command "$r = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/health -MaximumRedirection 0 -TimeoutSec 5 -ErrorAction Stop; if ($r.StatusCode -ne 200) { exit 1 }; Write-Output $r.StatusCode"
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    echo 'Pipeline sukses: aplikasi ter-deploy'
                } else {
                    echo 'Pipeline sukses: test dan build image berhasil'
                }
            }
        }

        failure {
            echo 'Pipeline gagal: cek stage yang merah'
        }
    }
}

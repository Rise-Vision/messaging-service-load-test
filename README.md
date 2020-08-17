## Messaging Service Load Test

This is a load testing system for the Messaging Service. It sets up multiple instances of a Simulated Display (client).

Every client connects to a configurable endpoint and optionally drops connection and reconnects on an interval.

The clients can be confgiured to connect at startup, or check a synchronous flag so that they all start up at roughly the same time for maximum load spike.

In general, this should simulate thousands of displays per minute attempting to connect to the Messaging Service.




### Configuration

A Kubernetes [ConfigMap](https://cloud.google.com/kubernetes-engine/docs/concepts/configmap) is used to configure pod environment variables.

Each pod will run one multiple instances of a Simulated Display and the deployment can scale up the number of pods.

 - MS_ENDPOINT(): The messaging service endpoint to connect Simulated Displays to
 - DISPLAY_COUNT(1): Number of Simulated Displays per pod
 - JITTER_MS(60,000): An upper limit to variable time to spread out connections. A 10,000ms jitter means all connections will be made within 10s
 - SYNC_SIGNAL_URL(): A url that should return 200 when all Simulated Displays should start connecting. Otherwise they'll start connecting immediately after pod startup
 - SYNC_SIGNAL_INTERVAL_MS(5000): Interval between calls to sync signal to determine whether connections should begin

#### Configuration Modification

###### Set current cluster
```
gcloud --project=messaging-service-180514 container clusters get-credentials --zone=us-central1-c messaging-service-load-test
```

###### View current configuration
```
kubectl describe configmap messaging-service-load-test-config
```

###### Update one environment variable

```
kubectl patch configmap messaging-service-load-test-config -p '{"data":{"DISPLAY_COUNT":"50"}}
```

###### Update multiple environment variables via editor
```
cd path-to-[gke-messaging-service-configs](https://github.com/Rise-Vision/gke-messaging-service-configs) repo
$EDITOR messaging-service-load-test.yaml
# change environment variables and save 
kubectl apply -f messaging-service-load-test.yaml
```

###### Scale node count
```
cloud container clusters resize messaging-service-load-test --node-pool default-pool --num-nodes 30
```

###### Scale pod count
```
kubectl scale --replicas=200 deployment/messaging-service-load-test
```

###### Notes on cost and test scaling

 - with 50 connections per pod
 - 30 nodes for 200 pods (10, 000 connections)
 - ~$0.50 per hour


### Deployment

#### Automated Deployment

The Docker image is hosted on Google Container Registry (gcr.io). 

It will be rebuilt during Circle CI build, and the new image will be assigned to the Kubernetes deployment.

#### Manual Deployment

###### Update the image after changing code and testing locally

Push new image to Google Cloud Registry

```
docker build -t messaging-service-load-test:$COMMIT_HASH
docker tag messaging-service-load-test:$COMMIT_HASH gcr.io/messaging-service-180514/messaging-service-load-test:$COMMIT_HASH
gcloud --project=messaging-service-180514 container clusters get-credentials --zone=us-central1-c messaging-service-load-test
gcloud auth configure-docker
docker push gcr.io/messaging-service-180514/messaging-service-load-test:$COMMIT_HASH
```

Update the kubernetes workload

```
kubectl patch deployment messaging-service-load-test -p  '{"spec":{"template":{"spec":{"containers":[{"name":"messaging-service-load-test","image":"gcr.io/messaging-service-180514/messaging-service-load-test:$COMMIT_HASH"}]}}}}'
```

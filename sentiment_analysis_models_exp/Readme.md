## This folder stores the sentiment classifier

### Directorys
* data: train/dev/test data
* experiment_results: Contains accuracy results from training on different feature sets and using different models

### Files
* experiments.py: Automatic model training with different feature sets (part of speech tagged, LIWC, etc). Uses both NLTK and SciKit Learn models
* features.py: Helper functions for extracting different feature sets
* sentiment_classifier.py: Employ model on data

### Instructions
To run experiments.py: python experiments.py -t <training_file_name> -d <develop_file_name> -o <output_file_name>
* Note: To reduce runtime, experiments.py uses a variable called run_type to determine what portion of code is required to run. If you want to run everything, set it to -1. Acceptable options: 1.1, 1.2, 2.1, -1


To run sentiment_classifier.py: python evaluate.py -d <testing_file_name> -w <output_file_name> -e <evaluate_file_name> -c <file_to_classify>
* Assumes files will be stored in /data/ directory
* Restaurant competition runs on word_features with binning

### Findings
* NLTK Naive Bayes model using tokenized word features performs best
* Feature selection and model based classification is likely to cause performance bottlenecks on a Raspberry Pi at expected scale
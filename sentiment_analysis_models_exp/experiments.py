
import re
import nltk
import pickle
import argparse
import os
import sys
import data_helper
from features import get_features_category_tuples
from sklearn import svm
from sklearn.naive_bayes import GaussianNB, BernoulliNB
import sklearn
import numpy
import pandas as pd
import random
from sklearn import tree
from nltk.classify import SklearnClassifier
from features import features_stub
import restaurant_data_helper
from restaurant_features import get_features_category_tuples, get_word_features, get_ngram_features, get_word_pos_features, get_word_pos_liwc_features

DATA_DIR = "data"

random.seed(10)


MODEL_DIR = "models/"
OUTPUT_DIR = "output/"
FEATURES_DIR = "features/"


def evaluate(classifier, features_category_tuples, reference_text=None, data_set_name=None):

    # YOUR CODE GOES HERE
    # TODO: evaluate your model
    # dev_accuracy = nltk.classify.accuracy(classifier, features_category_tuples)
    test_accuracy = nltk.classify.accuracy(
        classifier, features_category_tuples)

    features_only = [example[0] for example in features_category_tuples]

    reference_labels = [example[1] for example in features_category_tuples]
    predicted_labels = classifier.classify_many(features_only)
    confusion_matrix = nltk.ConfusionMatrix(reference_labels, predicted_labels)

    return test_accuracy, confusion_matrix


def build_features(data_file, feat_name):
    # read text data
    positive_texts, negative_texts = data_helper.get_reviews(
        os.path.join(DATA_DIR, data_file))

    category_texts = {"positive": positive_texts, "negative": negative_texts}

    # build features
    features_category_tuples, texts = get_features_category_tuples(
        category_texts, feat_name)
    
    #labelDict = {}
    #for item in features_category_tuples:
    #    for tup in item[0]:  #go through items in dict
    #        if tup == "BIGRAM_service_friendly" and item[0][tup] == 1:
    #            print(tup)
    #        labelDict[(tup, item[0][tup])] = item[1]
    #print(labelDict)
    return features_category_tuples, texts


def train_eval(train_file, feature_set, cl, eval_file=None):
    # train the model
    features_data, texts = build_features(train_file, feature_set)
    model = build_classifier(cl).train(features_data)
    if eval_file is not None:
        features_data, texts = build_features(eval_file, feature_set)
        accuracy, cm = evaluate(model, features_data,
                                texts, data_set_name=feature_set)
        print("The accuracy of {} is: {}".format(eval_file, accuracy))
        #print("Confusion Matrix:")
        #print(str(cm))
    else:
        accuracy = None
        cm = None
    return accuracy, cm, model


def build_classifier(classifier_name):
    """
    Accepted names: nb, dt, svm, sk_nb, sk_dt, sk_svm

    svm and sk_svm will return the same type of classifier.

    :param classifier_name:
    :return:
    """
    if classifier_name == "nb":
        cls = nltk.classify.NaiveBayesClassifier
    elif classifier_name == "nb_sk":
        cls = SklearnClassifier(BernoulliNB())
    elif classifier_name == "dt":
        cls = nltk.classify.DecisionTreeClassifier
    elif classifier_name == "dt_sk":
        cls = SklearnClassifier(tree.DecisionTreeClassifier())
    elif classifier_name == "svm_sk" or classifier_name == "svm":
        cls = SklearnClassifier(svm.SVC())
    else:
        assert False, "unknown classifier name:{}; known names: nb, svm, nb_sk, dt_sk, svm_sk".format(
            classifier_name)
    return cls

def no_bin_classify(model):
    out = open("nb-word_features_predictions.txt", "w")
    sys.stdout = out
    for review in restaurant_data_helper.get_reviews("./data/test_examples.tsv"):
        word_ft = get_word_features(review)
        print(model.classify(word_ft))
    sys.stdout = sys.__stdout__

DATA_DIR = "data"
abs_best = (0, None)

def classify_on_best(data_file, model, eval_set, feat_category):   
    global abs_best
    best_features = model.most_informative_features(10000)
    fh = open("all-tables.txt", 'w', encoding='utf-8') 
    data_path = os.path.join(DATA_DIR, data_file)
    eval_path = os.path.join(DATA_DIR, eval_set)
    devsets, text = features_stub(data_path, feat_category)
    evalsets, evaltext = features_stub(eval_path, feat_category)
    #print("Best features example ---")
    #print(best_features_set[0])
    #print("Feature sets example ---")
    #print(devsets[0])
    for i in [2**i for i in range(5, 15)]:
        selected_features = set([fname for fname, value in best_features[:i]])

        best = []
        for pair in devsets:
            review_dict = {}
            review = (review_dict, pair[1])
            #print(selected_features) #Selected features is a set of feature names
            #print(pair) #pair is a tuple ({'UNI_working: freq, name: freq,...}, label)
            for key in pair[0]:
                #print(key) #name, ex 'UNI_working'
                if key in selected_features:
                    #print("adding " + key + " from " + str(pair[0]))
                    review_dict[key] = pair[0][key]
            best.append(review)
        #print(best)
        
        
        #for item in best_features_set:
        #    print(item, labelDict[item])
        #    featuresets.append((item, labelDict[item]))
        classifier = nltk.NaiveBayesClassifier.train(best)
        accuracy = nltk.classify.accuracy(classifier, evalsets)
        print("{0:6d} {1:8.5f}".format(i, accuracy))

        fh.write("Feature count: {} \t Accuracy: {}".format(i,accuracy))
        
        if accuracy > abs_best[0]:
            abs_best = (accuracy, best)

def main():
    global abs_best
    all_feature_sets = [
        "word_pos_features", "word_features", "word_pos_liwc_features",
        #"word_embedding",
        #"liwc_features",
        # "binning_word_pos_features",
        #"binning_word_features", "binning_word_pos_liwc_features"
    ]

    parser = argparse.ArgumentParser(description='Assignment 4')
    parser.add_argument('-t', dest="data_fname", default="train_examples.tsv",
                        help='File name of the training data.')
    parser.add_argument('-d', dest="dev_fname", default="dev_examples.tsv",
                        help='File name of the dev data.')
    parser.add_argument('-r', dest="run_type", default=1.1,
                        help='Specify which portion of assignment you would like to run')
    parser.add_argument('-w', dest="output_fname",
                        default="COPY_TO_ALLRESULTS.txt", help='File name of the output file.')
    args = parser.parse_args()
    train_data = args.data_fname
    run_type = -1
    eval_data = [args.dev_fname, "test_examples.tsv"]

    if run_type == 1.1:     #Determines what classifiers to test on, will run all classifiers on a data set in a loop
        print("RUNNING ON 1.1")
        f = open(args.output_fname, "w")
        #classifierList = ["nb", "nb_sk", "dt", "dt_sk", "svm"]
        classifierList = ["nb"]
        feat_sets = ["word_features", "word_pos_features", "word_pos_liwc_features"]
    else:
        classifierList = ["nb"]
        feat_sets = ["word_features", "word_pos_features", "word_pos_liwc_features", "word_features_binning"]

    outDict = {}
    outDict["nb"] = "Naive Bayes NLTK"
    outDict["nb_sk"] = "Naive Bayes Sklearn"
    outDict["dt"] = "Decision Tree NLTK"
    outDict["dt_sk"] = "Decision Tree Sklearn"
    outDict["svm"] = "SVM Sklearn"

    #1.1 - 1.2: Get best features and run NLTK Naive Bayes
    print("\n===========================================\nNLTK NB\n===========================================")
    if run_type > 1.2: #We already know that the best feature set is word_features dev, so use this for rest of asg
        eval_data = ["dev_examples.tsv"]
        feat_sets = ["word_features"]
    for eval_set in eval_data:
        for feat_set in feat_sets:
            for classifier in classifierList:
                print("\nTraining with {}, using {} classifier on {} set".format(
                    feat_set, outDict[classifier], eval_set))
                accuracy, cm, model = train_eval(train_data, feat_set, classifier, eval_file=eval_set)
                if run_type == 1.1:
                    f.write("The accuracy of {} on the {} classifier on {} set is: {}\n".format(
                        feat_set, outDict[classifier], eval_set, accuracy))
                    f.write(str(cm))
                    f.write("\n")
                else:
                    if feat_set == "word_features":
                        no_bin_classify(model)
                        print("Label file created")
                    #print("CLASSIFYING ON BEST FEATURES FROM {}\n".format(eval_set))
                    classify_on_best(train_data, model, eval_set, feat_set)
    
    #2.1 Classify on Scikit NB & DT
    eval_data = ["dev_examples.tsv", "test_examples.tsv"]
    feat_sets = ["word_features"]
    if run_type == 2.1:
        print("\n===========================================\nSCIKIT NB & DT\n===========================================")
        #print(abs_best[1])
        for cl in ["nb", "nb_sk", "dt_sk","svm"]:
            for eval_set in eval_data:
                for feat_set in feat_sets:
                    model = build_classifier(cl).train(abs_best[1])
                    features_data, text = build_features(eval_set, feat_set)
                    test_accuracy, cm = evaluate(model, features_data)
                    print("{}: {} - {} is: {}".format(outDict[cl], eval_set, feat_set, test_accuracy))
                    #print(cm)
        #SVM with word embeddings
        for eval_set in eval_data:
            embeddings, text = build_features("train_examples.tsv", "word_embeddings")
            model = build_classifier(cl).train(embeddings)
            embeddings,text = build_features(eval_set, "word_embeddings")
            test_accuracy, cm = evaluate(model, embeddings)
            print("{}: {} - word embeddings is: {}".format(outDict[cl], eval_set, test_accuracy))
            print(cm)


if __name__ == "__main__":
    main()


import re
import nltk
import pickle
import argparse
import os
import sys
import data_helper
from features import get_features_category_tuples

DATA_DIR = "data"


def write_features_category(features_category_tuples, output_file_name):
    output_file = open(
        "{}-features.txt".format(output_file_name), "w", encoding="utf-8")
    for (features, category) in features_category_tuples:
        output_file.write("{0:<10s}\t{1}\n".format(category, features))
    output_file.close()


def get_classifier(classifier_fname):
    classifier_file = open(classifier_fname, 'rb')
    classifier = pickle.load(classifier_file)
    classifier_file.close()
    return classifier


def save_classifier(classifier, classifier_fname):
    #classifier_file = open(classifier_fname, 'wb')
    #pickle.dump(classifier, classifier_file)
    # classifier_file.close()
    info_file = open(classifier_fname.split(
        ".")[0] + '-informative-features.txt', 'w', encoding="utf-8")
    #sys.stdout = info_file
    # classifier.most_informative_features(100)
    #sys.stdout = sys.__stdout__
    for feature, n in classifier.most_informative_features(100):
        info_file.write("{0}\t".format(feature))
        info_file.write("{0}\n".format(n))
    info_file.close()


def evaluate(classifier, features_category_tuples, reference_text, data_set_name=None):

    # YOUR CODE GOES HERE
    # TODO: evaluate your model
    # dev_accuracy = nltk.classify.accuracy(classifier, features_category_tuples)
    test_accuracy = nltk.classify.accuracy(
        classifier, features_category_tuples)

    features_only = [example[0] for example in features_category_tuples]

    reference_labels = [example[1] for example in features_category_tuples]
    predicted_labels = classifier.classify_many(features_only)
    confusion_matrix = nltk.ConfusionMatrix(reference_labels, predicted_labels)

    # print(confusion_matrix)

    # for reference, predicted, text in zip(reference_labels, predicted_labels, reference_text):
    #    if reference != predicted:
    #        print("{0} {1}\n{2}\n\n".format(reference, predicted, text))
    name_map = {}
    name_map["word_features"] = "ngrams"
    name_map["word_pos_features"] = "pos"
    name_map["word_pos_liwc_features"] = "liwc"
    name_map["best"] = "best"
    f = open("output-"+name_map[data_set_name], "w")
    f.write("The accuracy of {} is: {}\n".format(data_set_name, test_accuracy))
    f.write(str(confusion_matrix))
    f.write("\n")

    return test_accuracy, confusion_matrix


def build_features(data_file, feat_name):
    # read text data
    positive_texts, negative_texts = data_helper.get_reviews(
        os.path.join(DATA_DIR, data_file))

    category_texts = {"positive": positive_texts, "negative": negative_texts}

    # build features
    features_category_tuples, texts = get_features_category_tuples(
        category_texts, feat_name)

    # save features to file
    datamap = {}
    # print("Feature: " + str(feat_name)+"_ Data: "+str(data_file))
    datamap["dev_examples.tsv"] = "development"
    datamap["train_examples.tsv"] = "training"
    write_features_category(features_category_tuples, str(
        feat_name)+"-"+datamap[str(data_file)])

    return features_category_tuples, texts


def train_model(datafile, feature_set, save_model=None):

    features_data, texts = build_features(datafile, feature_set)

    # YOUR CODE GOES HERE
    classifier = nltk.classify.NaiveBayesClassifier.train(features_data)

    datamap = {}

    info_file = open((str(feature_set)).split(
        ".")[0] + '-informative-features.txt', 'w', encoding="utf-8")
    for feature, n in classifier.most_informative_features(100):
        info_file.write("{0}\n".format(feature))

    # if save_model is not None:
    #    save_classifier(classifier, "classifier")
    return classifier


def train_eval(train_file, feature_set, eval_file=None):

    # train the model
    split_name = "train"

    model = train_model(train_file, feature_set, eval_file)

    else:
        accuracy = None
        cm = None

    return accuracy, cm


def main():

    # add the necessary arguments to the argument parser
    parser = argparse.ArgumentParser(description='Assignment 3')
    parser.add_argument('-d', dest="data_fname", default="test.txt",
                        help='File name of the testing data.')
    parser.add_argument('-w', dest="output_fname", default="all-results.txt",
                        help='File name of the output file.')
    args = parser.parse_args()
    train_data = args.data_fname
    eval_data = "dev_examples.tsv"
    f = open(args.output_fname, "w")

    for feat_set in ["word_features", "word_pos_features", "word_pos_liwc_features", "best"]:
    #for feat_set in ["best"]:
        print("\nTraining with {}".format(feat_set))
        accuracy, cm = train_eval(train_data, feat_set, eval_file=eval_data)
        if feat_set == "word_features" or feat_set == "word_pos_features":
            f.write("The accuracy of {} is: {}\n".format(feat_set, accuracy))
            f.write(str(cm))
            f.write("\n")


if __name__ == "__main__":
    main()


import re
import nltk
import pickle
import argparse
import os
import sys
import restaurant_data_helper
from restaurant_features import get_features_category_tuples, get_word_features, get_ngram_features, get_word_pos_features, get_word_pos_liwc_features

DATA_DIR = "data"


def write_features_category(features_category_tuples, output_file_name):
    output_file = open(
        "{}-features.txt".format(output_file_name), "w", encoding="utf-8")
    for (features, category) in features_category_tuples:
        #output_file.write("{0:<10s}\t{1}\n".format(category, features))
        output_file.write("{0:<10s}\t".format(category))
        for key, value in features.items():
            output_file.write(str(key)+":"+str(value)+" ")
        output_file.write("\n")
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
    f = open("output-"+name_map[data_set_name]+".txt", "w")
    f.write("The accuracy of {} is: {}\n".format(data_set_name, test_accuracy))
    f.write(str(confusion_matrix))
    f.write("\n")

    return test_accuracy, confusion_matrix


def build_features(data_file, feat_name):
    # read text data
    positive_texts, negative_texts = restaurant_data_helper.get_reviews(
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
    print("yes")
    print(features_data)
    classifier = nltk.classify.NaiveBayesClassifier.train(features_data)

    datamap = {}

    info_file = open((str(feature_set)).split(
        ".")[0]  + '_training-informative-features.txt', 'w', encoding="utf-8")
    for feature, n in classifier.most_informative_features(100):
        info_file.write("{0}\n".format(feature))

    # if save_model is not None:
    #    save_classifier(classifier, "classifier")
    return classifier


def train_eval(train_file, feature_set, eval_file=None, classify_file=None):

    # train the model
    split_name = "train"

    model = train_model(train_file, feature_set, eval_file)

    datamap = {}
    datamap["dev_examples.tsv"] = "development"
    datamap["train_examples.tsv"] = "training"
    # print(datamap[str(eval_file)])
    #save_classifier(model, str(feature_set).upper()+"-"+datamap[str(eval_file)])

    # save the model
    # if model is None:
    #    model = get_classifier(classifier_fname="classifier")

    # evaluate the model
    # info_file = open((str(feature_set).upper()+"-"+datamap[str(eval_file)]).split(
    #    ".")[0] + '-informative-features.txt', 'w', encoding="utf-8")
    #sys.stdout = info_file
    # model.most_informative_features(20)
    #sys.stdout = sys.__stdout__
    model.show_most_informative_features(20)
    if eval_file is not None:
        features_data, texts = build_features(eval_file, feature_set)
        accuracy, cm = evaluate(model, features_data,
                                texts, data_set_name=feature_set)
        print("The accuracy of {} is: {}".format(eval_file, accuracy))
        print("Confusion Matrix:")
        print(str(cm))
    else:
        accuracy = None
        cm = None
    classify(model, classify_file)
    return accuracy, cm


def classify(model, classify_file):
    out = open("restaurant-competition-model-P2-predictions.txt", "w")
    sys.stdout = out
    for review in restaurant_data_helper.get_reviews(os.path.join(DATA_DIR, classify_file), True):
        word_ft = get_word_features(review)
        print(model.classify(word_ft))
    sys.stdout = sys.__stdout__


def main():

    # add the necessary arguments to the argument parser
    parser = argparse.ArgumentParser(description='Assignment 3')
    parser.add_argument('-d', dest="data_fname", default="train_examples.tsv",
                        help='File name of the training data.')
    parser.add_argument('-w', dest="output_fname", default="all-results.txt",
                        help='File name of the output file.')
    parser.add_argument('-e', dest="eval_fname", default="dev_examples.tsv",
                        help='File name of the eval data.')
    parser.add_argument('-c', dest="classify_fname", default="test_examples.tsv",
                        help='File name of the classify data.')
    args = parser.parse_args()
    train_data = args.data_fname
    eval_data = args.eval_fname
    classify_data = args.classify_fname
    f = open(args.output_fname, "w")

    for feat_set in ["word_features"]:
    #for feat_set in ["best"]:
        print("\nTraining with {}".format(feat_set))
        print(train_data)
        accuracy, cm = train_eval(train_data, feat_set, eval_file=eval_data, classify_file = classify_data)
        if feat_set == "word_features" or feat_set == "word_pos_features":
            f.write("The accuracy of the best classifier is: {}\n".format(accuracy))
            f.write(str(cm))
            f.write("\n")


if __name__ == "__main__":
    main()

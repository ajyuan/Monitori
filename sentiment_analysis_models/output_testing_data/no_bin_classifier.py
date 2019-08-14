
import re
import nltk
import pickle
import argparse
import os
import sys
import data_helper

DATA_DIR = "data"



import nltk
import re
import word_category_counter
import data_helper
import os, sys

DATA_DIR = "data"



def normalize(token, should_normalize=True):
    """
    This function performs text normalization.

    If should_normalize is False then we return the original token unchanged.
    Otherwise, we return a normalized version of the token, or None.

    For some tokens (like stopwords) we might not want to keep the token. In
    this case we return None.

    :param token: str: the word to normalize
    :param should_normalize: bool
    :return: None or str
    """
    if not should_normalize:
        normalized_token = token

    else:
        if token.lower() not in nltk.corpus.stopwords.words("english") and bool(re.search("\w",token)):
            normalized_token = token.lower()
        else:
            normalized_token = None

    return normalized_token



def get_words_tags(text, should_normalize=True):
    """
    This function performs part of speech tagging and extracts the words
    from the review text.

    You need to :
        - tokenize the text into sentences
        - word tokenize each sentence
        - part of speech tag the words of each sentence

    Return a list containing all the words of the review and another list
    containing all the part-of-speech tags for those words.

    :param text:
    :param should_normalize:
    :return:
    """
    words = []
    tags = []

    # tokenization for each sentence

    ###     YOUR CODE GOES HERE
    sentences = nltk.sent_tokenize(text)
    words = [normalize(word) for sentence in sentences for word in nltk.word_tokenize(sentence) if normalize(word) != None]
    tags = [tag[1] for sentence in sentences for tag in nltk.pos_tag(nltk.word_tokenize(sentence)) if normalize(tag[0]) != None]
    for bigram in list(nltk.bigrams(words)):
        #print(bigram)
        words.append(bigram[0] + "_" + bigram[1])
    for bigram in list(nltk.bigrams(tags)):
        tags.append(bigram[0] + "_" + bigram[1])
    return words, tags


def get_ngram_features(tokens):
    """
    This function creates the unigram and bigram features as described in
    the assignment3 handout.

    :param tokens:
    :return: feature_vectors: a dictionary values for each ngram feature
    """
    feature_vectors = {}
    words = []
    for item in tokens:
        if "_" not in item:
            words.append("UNI_" + item)
        else:
            words.append("BIGRAM_" + item)
    return feature_vectors

FEATURE_SETS = {"word_features"}

def get_features_category_tuples(category_text_dict, feature_set):
    """

    You will might want to update the code here for the competition part.

    :param category_text_dict:
    :param feature_set:
    :return:
    """
    features_category_tuples = []
    all_texts = []

    assert feature_set in FEATURE_SETS, "unrecognized feature set:{}, Accepted values:{}".format(feature_set, FEATURE_SETS)

    for category in category_text_dict:
        for text in category_text_dict[category]:

            words, tags = get_words_tags(text)
            feature_vectors = {}

            ###     YOUR CODE GOES HERE
            words, tags = get_words_tags(text)
            if feature_set == "word_features":
                feature_vectors.update(get_ngram_features(words))
            #else:
            #    raise Exception("Not a feature set".format(feature_set))
            features_category_tuples.append((feature_vectors, category))
            all_texts.append(text)

    return features_category_tuples, all_texts

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

    return test_accuracy, confusion_matrix


def build_features(data_file, feat_name):
    # read text data
    positive_texts, negative_texts = data_helper.get_reviews(
        os.path.join(DATA_DIR, data_file))
    #print(data_helper.get_reviews(os.path.join(DATA_DIR, data_file))["positive"])
    category_texts = {"positive": positive_texts, "negative": negative_texts}
    #print(category_texts["positive"])
    # build features
    features_category_tuples, texts = get_features_category_tuples(
        category_texts, feat_name)
    #print(features_category_tuples)
    return features_category_tuples, texts


def train_model(datafile, feature_set, save_model=None):

    features_data, texts = build_features(datafile, feature_set)

    # YOUR CODE GOES HERE
    classifier = nltk.classify.NaiveBayesClassifier.train(features_data)
    datamap = {}
    info_file = open((str(feature_set)).split(
        ".")[0]  + '_training-informative-features.txt', 'w', encoding="utf-8")
    for feature, n in classifier.most_informative_features(100):
        info_file.write("{0}\n".format(feature))

    # if save_model is not None:
    #    save_classifier(classifier, "classifier")
    return classifier


def train_eval(train_file, feature_set, eval_file=None):

    # train the model
    split_name = "train"

    model = train_model(train_file, feature_set, eval_file)
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
    return accuracy, cm

def main():
    # add the necessary arguments to the argument parser
    parser = argparse.ArgumentParser(description='Assignment 3')
    parser.add_argument('-d', dest="data_fname", default="train_examples.tsv",
                        help='File name of the testing data.')
    parser.add_argument('-w', dest="output_fname", default="COPY_TO_ALLTEST1.txt",
                        help='File name of the output file.')
    args = parser.parse_args()
    train_data = args.data_fname
    eval_data = "dev_examples.tsv"
    f = open(args.output_fname, "w")

    for feat_set in ["word_features"]:
    #for feat_set in ["best"]:
        print("\nTraining with {}".format(feat_set))
        accuracy, cm = train_eval(train_data, feat_set, eval_file=eval_data)
        if feat_set == "word_features":
            f.write("The accuracy of {} is: {}\n".format(feat_set, accuracy))
            f.write(str(cm))
            f.write("\n")

if __name__ == "__main__":
    main()

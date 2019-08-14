
import nltk
import re
import word_category_counter
import data_helper
import os, sys

DATA_DIR = "data"
LIWC_DIR = "liwc"

word_category_counter.load_dictionary(LIWC_DIR)


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
    #words = ["UNI_" + word for word in words_s]
    #tags = ["UNI_POS_" + tag for tag in tags_s]
    #bigrams = map(lambda tup : "BIGRAM_" + tup[0] + "_" + tup[1], nltk.bigrams(words_s))
    #tags_bigrams = map(lambda tup : "BI_POS_" + tup[0] + "_" + tup[1], nltk.bigrams(tags_s))
    #print(list(nltk.bigrams(words)))
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
    ###     YOUR CODE GOES HERE
    for word in words:
        #word = normalize(word)
        #if word == None:
        #    continue
        if word not in feature_vectors:
            feature_vectors[word] = 1
        elif feature_vectors[word] < 2:
            feature_vectors[word] = 3

    return feature_vectors


def get_pos_features(tags):
    """
    This function creates the unigram and bigram part-of-speech features
    as described in the assignment3 handout.

    :param tags: list of POS tags
    :return: feature_vectors: a dictionary values for each ngram-pos feature
    """
    feature_vectors = {}
    tags_proc = []
    ###     YOUR CODE GOES HERE
    for item in tags:
        if "_" not in item:
            tags_proc.append("UNI_POS_" + item)
        else:
            tags_proc.append("BI_POS_" + item)
    for tag in tags_proc:
        if tag not in feature_vectors:
            feature_vectors[tag] = 1
        feature_vectors[tag] = bin(feature_vectors[tag])

    return feature_vectors

def get_word_features(text):
    words, tags = get_words_tags(text)
    return get_ngram_features(words)

def get_word_pos_features(text):
    words, tags = get_words_tags(text)
    return {**get_ngram_features(words), **get_pos_features(tags)}

def get_word_pos_liwc_features(text):
    words, tags = get_words_tags(text)
    return {**get_ngram_features(words), **get_pos_features(tags), **get_liwc_features(words)}

def bin(count):
    """
    Results in bins of  0, 1, 2, 3 >=
    :param count: [int] the bin label
    :return:
    """
    the_bin = None
    ###     YOUR CODE GOES HERE
    the_bin = count if count < 2 else 3

    return the_bin

def liwc_bin(count):
        return 5 if count <= 5 else 9

def get_liwc_features(words):
    """
    Adds a simple LIWC derived feature

    :param words:
    :return:
    """    

    feature_vectors = {}
    text = " ".join(words)
    liwc_scores = word_category_counter.score_text(text)

    # All possible keys to the scores start on line 269
    # of the word_category_counter.py script
    #negative_score = liwc_scores["Negative Emotion"]
    #positive_score = liwc_scores["Positive Emotion"]
    #feature_vectors["Negative Emotion"] = liwc_bin(negative_score)
    #feature_vectors["Positive Emotion"] = liwc_bin(positive_score)
    
    for tup in liwc_scores:
        feature_vectors["LIWC:" + tup] = liwc_bin(liwc_scores[tup])

    return feature_vectors


FEATURE_SETS = {"word_pos_features", "word_features", "word_pos_liwc_features", "best"}

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
            elif feature_set == "word_pos_features":
                feature_vectors.update(get_ngram_features(words))
                feature_vectors.update(get_pos_features(tags))
            elif feature_set == "word_pos_liwc_features":
                feature_vectors.update(get_ngram_features(words))
                feature_vectors.update(get_pos_features(tags))
                feature_vectors.update(get_liwc_features(words))
            elif feature_set == "best":
                feature_vectors.update(get_ngram_features(words))
                #text = " ".join(words)
                #liwc_scores = word_category_counter.score_text(text)
                #for tup in ["Negative Emotion", "Positive Emotion"]:
                #    feature_vectors["LIWC_" + tup] = liwc_bin(liwc_scores[tup])

            #else:
            #    raise Exception("Not a feature set".format(feature_set))
            features_category_tuples.append((feature_vectors, category))
            all_texts.append(text)

    return features_category_tuples, all_texts


def write_features_category(features_category_tuples, outfile_name):
    """
    Save the feature values to file.

    :param features_category_tuples:
    :param outfile_name:
    :return:
    """
    with open(outfile_name, "w", encoding="utf-8") as fout:
        for (features, category) in features_category_tuples:
            fout.write("{0:<10s}\t{1}\n".format(category, features))


if __name__ == "__main__":
    #file = open("./data/test.txt")
    #text = "this is not a love hate love hotdog. not a hotdog. i love sandwiches wing wong"
    #for text in file:
    #print(get_liwc_features(nltk.word_tokenize("this is not a love hate love hotdog. not a hotdog. i love sandwiches wing wong")))
    #words, tags = get_words_tags("this is not a love hate love hotdog. not a hotdog. i love sandwiches wing wong")
    #print(words)
    #print(get_word_pos_features(text))
    out = open("restaurant-competition-model-P1-predictions.txt", "w")
    #sys.stdout = out
    for review in data_helper.get_reviews("./data/test.txt"):
        print(get_word_features(review))
    sys.stdout = sys.__stdout__
    pass


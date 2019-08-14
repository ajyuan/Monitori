
import re

import pandas as pd
import nltk


def get_reviews(fpath):
    """
    :param fpath: file path to dataset
    :return:
    """

    df = pd.read_csv(fpath, sep="\t")
    pos = df.loc[df.sentiment=="pos"]
    neg = df.loc[df.sentiment=="neg"]
    #print(pos["text"])
    return pos["text"], neg["text"]




def make_vocab():
    df = pd.read_csv("data/dataset_examples.tsv", sep="\t")

    vocab = {"lower": [], "upper": []}

    for row in df.itertuples():
        toks = nltk.word_tokenize(row.text)
        vocab["lower"].extend([t.lower() for t in toks])
        vocab["upper"].extend(toks)

    for voc in ["lower", "upper"]:
        with open("data/vocab-{}.txt".format(voc), "w") as fout:
            for j, w in enumerate(set(vocab[voc])):
                fout.write("{} {}\n".format(w, j))







if __name__ == "__main__":
    make_vocab()

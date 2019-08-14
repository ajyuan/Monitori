
import re

import pandas as pd



def get_reviews(fpath, classify=False):
    """
    :param fpath: file path to dataset
    :return:
    """
    if classify:
        with open(fpath, "r") as fin:
            lines = [line.strip().rstrip() for line in fin.read().split("\n")]
        return lines

    else:
        df = pd.read_csv(fpath, sep="\t")
        pos = df.loc[df.sentiment=="pos"]
        neg = df.loc[df.sentiment=="neg"]
        return pos["text"], neg["text"]




def test_main():
    pass



if __name__ == "__main__":
    test_main()

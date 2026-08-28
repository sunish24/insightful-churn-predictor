"""NetworkX customer-similarity graph + node-level churn signals."""
from __future__ import annotations
from functools import lru_cache
from typing import Dict, List
import numpy as np
import pandas as pd
import networkx as nx
from sklearn.neighbors import NearestNeighbors


def build_customer_graph(X: pd.DataFrame, churn: pd.Series,
                         k: int = 5) -> nx.Graph:
    """k-NN similarity graph in feature space (capped for performance)."""
    n = min(len(X), 1500)
    X = X.iloc[:n].reset_index(drop=True)
    churn = churn.iloc[:n].reset_index(drop=True)
    nn = NearestNeighbors(n_neighbors=k + 1).fit(X.values)
    _, idx = nn.kneighbors(X.values)
    G = nx.Graph()
    for i, neighbours in enumerate(idx):
        G.add_node(i, churn=int(churn.iloc[i]))
        for j in neighbours[1:]:
            G.add_edge(int(i), int(j))
    return G


def graph_metrics(G: nx.Graph) -> Dict[str, float]:
    deg = dict(G.degree())
    clustering = nx.clustering(G)
    churn_attr = nx.get_node_attributes(G, "churn")
    neighbour_churn = {}
    for n in G.nodes:
        neigh = list(G.neighbors(n))
        neighbour_churn[n] = (
            float(np.mean([churn_attr[m] for m in neigh])) if neigh else 0.0
        )
    return {
        "avg_degree": float(np.mean(list(deg.values()))),
        "avg_clustering": float(np.mean(list(clustering.values()))),
        "avg_neighbour_churn_rate": float(np.mean(list(neighbour_churn.values()))),
        "n_nodes": int(G.number_of_nodes()),
        "n_edges": int(G.number_of_edges()),
    }


def top_risky_nodes(G: nx.Graph, top_k: int = 10) -> List[Dict]:
    churn_attr = nx.get_node_attributes(G, "churn")
    rows = []
    for n in G.nodes:
        neigh = list(G.neighbors(n))
        ncr = (np.mean([churn_attr[m] for m in neigh]) if neigh else 0.0)
        rows.append({
            "node": int(n),
            "degree": int(G.degree(n)),
            "clustering": float(nx.clustering(G, n)),
            "neighbour_churn_rate": float(ncr),
            "self_churn": int(churn_attr[n]),
        })
    rows.sort(key=lambda r: -r["neighbour_churn_rate"])
    return rows[:top_k]


@lru_cache(maxsize=1)
def _training_frame():
    """Transformed feature matrix + churn labels, built from the saved artifacts."""
    from backend.preprocessing.loader import load_telco
    from backend.preprocessing.preprocessor import (
        clean_telco, load_preprocessor, TARGET_COL,
    )
    from backend.preprocessing.feature_engineering import add_engineered_features

    pre, meta = load_preprocessor()
    df = add_engineered_features(clean_telco(load_telco()))
    churn = df[TARGET_COL].astype(int)
    X = pd.DataFrame(pre.transform(df.drop(columns=[TARGET_COL])),
                     columns=meta.feature_names_out)
    return X, churn


@lru_cache(maxsize=8)
def network_summary(k: int = 5, top_k: int = 10) -> Dict:
    """Graph-level metrics plus the nodes sitting in the churniest neighbourhoods."""
    X, churn = _training_frame()
    G = build_customer_graph(X, churn, k=k)
    return {"metrics": graph_metrics(G), "top_risky_nodes": top_risky_nodes(G, top_k=top_k)}

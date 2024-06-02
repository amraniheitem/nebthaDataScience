import sys
import json
import pandas as pd

def analyse_maladie(profiles):
    maladies_par_nom = {}
    for profile in profiles:
        nom_patient = profile['fullname']
        maladies = profile['maladieCronique']
        maladies_par_nom[nom_patient] = maladies

    maladies_occurrences = pd.Series([maladie for maladies in maladies_par_nom.values() for maladie in maladies]).value_counts().to_dict()
    return maladies_occurrences

def analyse_wilaya(orders):
    wilayas = [order['Willaya'] for order in orders]
    wilaya_occurrences = pd.Series(wilayas).value_counts().to_dict()
    return wilaya_occurrences

def analyse_product(orders):
    products = []
    for order in orders:
        print(f"Order: {order}", file=sys.stderr)
        if 'Pannier' in order:
            for item in order['Pannier']:
                product_id = item.get('Product')
                if product_id:
                    products.append(product_id)
    
    print(f"All products: {products}", file=sys.stderr)

    hashable_products = [product for product in products if isinstance(product, (int, str))]
    non_hashable_products = [product for product in products if not isinstance(product, (int, str))]
    
    if non_hashable_products:
        print(f"Non-hashable products: {non_hashable_products}", file=sys.stderr)
    
    product_occurrences = pd.Series(hashable_products).value_counts().to_dict()
    print(f"Product occurrences: {product_occurrences}", file=sys.stderr)
    return product_occurrences

if __name__ == "__main__":
    analysis_type = sys.argv[1]
    input_data = sys.stdin.read()
    
    try:
        data = json.loads(input_data)
        print(f"Input data: {data}", file=sys.stderr)
    except json.JSONDecodeError:
        print("Error decoding JSON input data", file=sys.stderr)
        sys.exit(1)

    if analysis_type == 'maladie':
        result = analyse_maladie(data)
    elif analysis_type == 'wilaya':
        result = analyse_wilaya(data)
    elif analysis_type == 'product':
        result = analyse_product(data)
    else:
        print("Invalid analysis type", file=sys.stderr)
        sys.exit(1)

    output_data = json.dumps(result)
    print(output_data)
class MemStorage:
    """
    In-memory storage for extracted codes
    """
    def __init__(self):
        self.codes = {}
        self.current_id = 0
    
    def get_all_codes(self):
        """
        Get all extracted codes
        Returns:
            list: List of dictionaries containing all extracted codes
        """
        return list(self.codes.values())
    
    def get_codes_by_payer(self, payer_name):
        """
        Get extracted codes by payer name
        Args:
            payer_name: Payer name to filter by
        Returns:
            list: List of dictionaries containing extracted codes for the specified payer
        """
        return [code for code in self.codes.values() if code['payer_name'] == payer_name]
    
    def get_codes_by_line_of_business(self, line_of_business):
        """
        Get extracted codes by line of business
        Args:
            line_of_business: Line of business to filter by
        Returns:
            list: List of dictionaries containing extracted codes for the specified line of business
        """
        return [code for code in self.codes.values() if code['line_of_business'] == line_of_business]
    
    def get_codes_by_year(self, year):
        """
        Get extracted codes by year
        Args:
            year: Year to filter by
        Returns:
            list: List of dictionaries containing extracted codes for the specified year
        """
        return [code for code in self.codes.values() if code['year'] == year]
    
    def save_codes(self, codes_to_save):
        """
        Save extracted codes to storage
        Args:
            codes_to_save: List of dictionaries containing extracted codes to save
        Returns:
            list: List of dictionaries containing all saved codes with IDs
        """
        saved_codes = []
        
        for code in codes_to_save:
            self.current_id += 1
            code_with_id = {**code, 'id': self.current_id}
            self.codes[self.current_id] = code_with_id
            saved_codes.append(code_with_id)
        
        return saved_codes
    
    def search_codes(self, search_term):
        """
        Search extracted codes
        Args:
            search_term: Term to search for
        Returns:
            list: List of dictionaries containing extracted codes that match the search term
        """
        if not search_term:
            return self.get_all_codes()
        
        search_term = search_term.lower()
        
        return [
            code for code in self.codes.values() 
            if search_term in code['code'].lower() or
               search_term in code['payer_name'].lower() or
               search_term in code['line_of_business'].lower() or
               search_term in code['source_file'].lower()
        ]
    
    def clear_all_codes(self):
        """
        Clear all extracted codes from storage
        """
        self.codes = {}
        self.current_id = 0

# Create a singleton instance of the storage
storage = MemStorage()
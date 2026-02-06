import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { Customer } from '@/types/customer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

type SortKey = 'id' | 'churnProbability' | 'tenure' | 'monthlyCharges' | 'supportCalls';
type SortOrder = 'asc' | 'desc';

export function CustomerTable({ customers, onCustomerClick }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('churnProbability');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || customer.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortKey === 'id') {
        return multiplier * a.id.localeCompare(b.id);
      }
      return multiplier * (a[sortKey] - b[sortKey]);
    });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const RiskBadge = ({ level, probability }: { level: string; probability: number }) => {
    const badgeClass = level === 'high' ? 'risk-badge-high' : level === 'medium' ? 'risk-badge-medium' : 'risk-badge-low';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
        {(probability * 100).toFixed(0)}%
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Filters */}
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="high">🔴 High Risk</SelectItem>
            <SelectItem value="medium">🟡 Medium Risk</SelectItem>
            <SelectItem value="low">🟢 Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/30">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('id')}
              >
                Customer ID <SortIcon column="id" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('churnProbability')}
              >
                Churn Risk <SortIcon column="churnProbability" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('tenure')}
              >
                Tenure <SortIcon column="tenure" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('monthlyCharges')}
              >
                Monthly <SortIcon column="monthlyCharges" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contract
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('supportCalls')}
              >
                Support <SortIcon column="supportCalls" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <motion.tr
                key={customer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onCustomerClick(customer)}
                className="data-table-row"
              >
                <td className="px-4 py-4 font-medium text-foreground">{customer.id}</td>
                <td className="px-4 py-4">
                  <RiskBadge level={customer.riskLevel} probability={customer.churnProbability} />
                </td>
                <td className="px-4 py-4 text-muted-foreground">{customer.tenure} mo</td>
                <td className="px-4 py-4 text-muted-foreground">${customer.monthlyCharges.toFixed(2)}</td>
                <td className="px-4 py-4 text-muted-foreground">{customer.contractType}</td>
                <td className="px-4 py-4 text-muted-foreground">{customer.supportCalls} calls</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 text-sm text-muted-foreground">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>
    </motion.div>
  );
}

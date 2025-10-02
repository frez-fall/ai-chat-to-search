/**
 * Destination Cards Component
 * Shows recommended destinations by category
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Sparkles, Mountain, Snowflake, Building, Wine } from 'lucide-react';
import type { DestinationRecommendation, GroupedDestinations } from '../types/destinations';

interface DestinationCardsProps {
  onDestinationSelect?: (destination: DestinationRecommendation) => void;
  selectedCategory?: string;
}

export default function DestinationCards({ 
  onDestinationSelect,
  selectedCategory 
}: DestinationCardsProps) {
  const [destinations, setDestinations] = useState<GroupedDestinations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || 'all');

  useEffect(() => {
    fetchDestinations();
  }, [activeCategory]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      
      const response = await fetch(`/api/destinations?${params}`);
      const data = await response.json();
      setDestinations(data);
    } catch (error) {
      console.error('Failed to fetch destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'island-vibes':
        return <Sparkles className="w-5 h-5" />;
      case 'mountain-views':
        return <Mountain className="w-5 h-5" />;
      case 'snowy-adventures':
        return <Snowflake className="w-5 h-5" />;
      case 'city-escapes':
        return <Building className="w-5 h-5" />;
      case 'wine-tours':
        return <Wine className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'island-vibes':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'mountain-views':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'snowy-adventures':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'city-escapes':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'wine-tours':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const categories = [
    { id: 'all', name: 'All Destinations', icon: <MapPin className="w-5 h-5" /> },
    { id: 'island-vibes', name: 'Island Vibes', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'mountain-views', name: 'Mountain Views', icon: <Mountain className="w-5 h-5" /> },
    { id: 'snowy-adventures', name: 'Snowy Adventures', icon: <Snowflake className="w-5 h-5" /> },
    { id: 'city-escapes', name: 'City Escapes', icon: <Building className="w-5 h-5" /> },
    { id: 'wine-tours', name: 'Wine Tours', icon: <Wine className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <div key={cat.id} className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
              activeCategory === category.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {category.icon}
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Destination cards */}
      {destinations && destinations.categories.map(categoryGroup => (
        <div key={categoryGroup.category} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              {getCategoryIcon(categoryGroup.category)}
              <span>{categoryGroup.display_name}</span>
            </h3>
            <span className="text-sm text-gray-500">
              {categoryGroup.destinations.length} destinations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryGroup.destinations.map(destination => (
              <button
                key={destination.id}
                onClick={() => onDestinationSelect?.(destination)}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                {destination.image_url ? (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={destination.image_url}
                      alt={destination.name}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-white/50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {destination.name}
                      </h4>
                      <p className="text-sm text-gray-500">{destination.iata_code}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>

                  {destination.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {destination.description}
                    </p>
                  )}

                  {/* Category badge */}
                  <div className="pt-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(destination.category)}`}>
                      {getCategoryIcon(destination.category)}
                      <span className="ml-1">{categoryGroup.display_name}</span>
                    </span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {destinations && destinations.categories.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations found</h3>
          <p className="text-sm text-gray-500">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
/**
 * Search Status Component
 * Shows current search parameters
 */

'use client';

import React from 'react';
import { MapPin, Calendar, Users, ArrowRight, Check, X } from 'lucide-react';
import type { SearchParameters } from '../types/search';

interface SearchStatusProps {
  parameters: SearchParameters;
  onEdit?: (field: keyof SearchParameters) => void;
}

export default function SearchStatus({ parameters, onEdit }: SearchStatusProps) {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPassengers = () => {
    const parts = [];
    if (parameters.adults) {
      parts.push(`${parameters.adults} adult${parameters.adults > 1 ? 's' : ''}`);
    }
    if (parameters.children && parameters.children > 0) {
      parts.push(`${parameters.children} child${parameters.children > 1 ? 'ren' : ''}`);
    }
    if (parameters.infants && parameters.infants > 0) {
      parts.push(`${parameters.infants} infant${parameters.infants > 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(', ') : '1 adult';
  };

  const formatCabinClass = () => {
    const classes = {
      'Y': 'Economy',
      'S': 'Premium Economy',
      'C': 'Business',
      'F': 'First Class',
    };
    return classes[parameters.cabin_class || 'Y'];
  };

  const getTripTypeLabel = () => {
    const types = {
      'return': 'Round Trip',
      'oneway': 'One Way',
      'multicity': 'Multi-City',
    };
    return types[parameters.trip_type || 'return'];
  };

  const isFieldSet = (field: string) => {
    switch (field) {
      case 'origin':
        return !!parameters.origin_code;
      case 'destination':
        return !!parameters.destination_code;
      case 'dates':
        return !!parameters.departure_date;
      case 'passengers':
        return true; // Always has default
      default:
        return false;
    }
  };

  return (
    <div className="space-y-3">
      {/* Trip type badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {getTripTypeLabel()}
        </span>
        {parameters.is_complete && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            <Check className="w-3 h-3 mr-1" />
            Ready to search
          </span>
        )}
      </div>

      {/* Main parameters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Origin */}
        <button
          onClick={() => onEdit?.('origin_code')}
          className={`flex items-start space-x-2 p-3 rounded-lg border transition-colors ${
            isFieldSet('origin')
              ? 'border-gray-200 bg-white hover:bg-gray-50'
              : 'border-dashed border-gray-300 bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500">From</p>
            <p className="text-sm font-medium text-gray-900">
              {parameters.origin_name || parameters.origin_code || 'Select origin'}
            </p>
            {parameters.origin_code && (
              <p className="text-xs text-gray-500">{parameters.origin_code}</p>
            )}
          </div>
        </button>

        {/* Destination */}
        <button
          onClick={() => onEdit?.('destination_code')}
          className={`flex items-start space-x-2 p-3 rounded-lg border transition-colors ${
            isFieldSet('destination')
              ? 'border-gray-200 bg-white hover:bg-gray-50'
              : 'border-dashed border-gray-300 bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500">To</p>
            <p className="text-sm font-medium text-gray-900">
              {parameters.destination_name || parameters.destination_code || 'Select destination'}
            </p>
            {parameters.destination_code && (
              <p className="text-xs text-gray-500">{parameters.destination_code}</p>
            )}
          </div>
        </button>

        {/* Dates */}
        <button
          onClick={() => onEdit?.('departure_date')}
          className={`flex items-start space-x-2 p-3 rounded-lg border transition-colors ${
            isFieldSet('dates')
              ? 'border-gray-200 bg-white hover:bg-gray-50'
              : 'border-dashed border-gray-300 bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500">
              {parameters.trip_type === 'return' ? 'Departure' : 'Date'}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(parameters.departure_date)}
            </p>
            {parameters.trip_type === 'return' && parameters.return_date && (
              <>
                <p className="text-xs text-gray-500 mt-1">Return</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(parameters.return_date)}
                </p>
              </>
            )}
          </div>
        </button>

        {/* Passengers & Class */}
        <button
          onClick={() => onEdit?.('adults')}
          className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <Users className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500">Passengers</p>
            <p className="text-sm font-medium text-gray-900">
              {formatPassengers()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCabinClass()}
            </p>
          </div>
        </button>
      </div>

      {/* Multi-city segments */}
      {parameters.trip_type === 'multicity' && parameters.multi_city_segments && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Flight Segments
          </p>
          <div className="space-y-1">
            {parameters.multi_city_segments.map((segment, index) => (
              <div key={segment.id} className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">{index + 1}.</span>
                <span className="font-medium">{segment.origin_code}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="font-medium">{segment.destination_code}</span>
                <span className="text-gray-500">on {formatDate(segment.departure_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {!parameters.is_complete && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Search progress</span>
            <span>{getCompletionPercentage()}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  function getCompletionPercentage() {
    let completed = 0;
    const required = parameters.trip_type === 'return' ? 4 : 3;
    
    if (parameters.origin_code) completed++;
    if (parameters.destination_code) completed++;
    if (parameters.departure_date) completed++;
    if (parameters.trip_type === 'return' && parameters.return_date) completed++;
    if (parameters.trip_type === 'multicity' && parameters.multi_city_segments?.length >= 2) {
      completed = 4; // Consider complete for multi-city with segments
    }
    
    return Math.round((completed / required) * 100);
  }
}
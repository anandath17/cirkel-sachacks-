import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import React from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'competition' | 'challenge' | 'hackathon';
  prize: {
    type: 'cash' | 'gift' | 'certificate';
    value: string;
  };
  sponsor?: {
    name: string;
    logo: string;
  };
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  maxParticipants?: number;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'upcoming' | 'ongoing' | 'completed';
  bannerImage: string;
}

// Dummy data untuk events
const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'AI Innovation Hackathon 2024',
    description: 'AI solution development competition for social problems. Total prize of $50,000 and mentoring opportunities from experts.',
    startDate: '2024-04-15',
    endDate: '2024-04-17',
    type: 'hackathon',
    prize: {
      type: 'cash',
      value: '$50,000'
    },
    sponsor: {
      name: 'TechCorp Global',
      logo: 'https://placehold.co/100x100'
    },
    participants: [
      { id: 'u1', name: 'John Smith', avatar: 'https://placehold.co/100x100' },
      { id: 'u2', name: 'Emma Wilson', avatar: 'https://placehold.co/100x100' },
      { id: 'u3', name: 'Michael Brown', avatar: 'https://placehold.co/100x100' },
      { id: 'u4', name: 'Sarah Davis', avatar: 'https://placehold.co/100x100' }
    ],
    maxParticipants: 100,
    skills: ['AI/ML', 'Python', 'Data Science'],
    difficulty: 'advanced',
    status: 'upcoming',
    bannerImage: 'https://placehold.co/1200x630/4338ca/ffffff?text=Hackathon+AI+2024'
  },
  {
    id: '2',
    title: 'UI/UX Design Challenge',
    description: 'Mental health app interface design challenge. Get direct feedback from professional designers.',
    startDate: '2024-03-25',
    endDate: '2024-04-10',
    type: 'challenge',
    prize: {
      type: 'certificate',
      value: 'Professional Certificate & Portfolio Review'
    },
    participants: [
      { id: 'u5', name: 'Emily Chen', avatar: 'https://placehold.co/100x100' },
      { id: 'u6', name: 'Robert Taylor', avatar: 'https://placehold.co/100x100' }
    ],
    maxParticipants: 50,
    skills: ['UI Design', 'UX Research', 'Figma'],
    difficulty: 'intermediate',
    status: 'ongoing',
    bannerImage: 'https://placehold.co/1200x630/0891b2/ffffff?text=UI/UX+Challenge'
  },
  {
    id: '3',
    title: 'Web Development Competition',
    description: 'Competition to create responsive websites focusing on performance and accessibility. Amazing prizes await!',
    startDate: '2024-05-01',
    endDate: '2024-05-15',
    type: 'competition',
    prize: {
      type: 'gift',
      value: 'MacBook Pro + Premium Course Bundle'
    },
    sponsor: {
      name: 'WebDev Academy',
      logo: 'https://placehold.co/100x100'
    },
    participants: [
      { id: 'u7', name: 'James Wilson', avatar: 'https://placehold.co/100x100' },
      { id: 'u8', name: 'Lisa Anderson', avatar: 'https://placehold.co/100x100' },
      { id: 'u9', name: 'David Miller', avatar: 'https://placehold.co/100x100' }
    ],
    maxParticipants: 75,
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    difficulty: 'intermediate',
    status: 'upcoming',
    bannerImage: 'https://placehold.co/1200x630/059669/ffffff?text=WebDev+Competition'
  },
  {
    id: '4',
    title: 'Algorithms & Data Structures Challenge',
    description: 'Enhance your problem-solving skills through weekly programming challenges.',
    startDate: '2024-03-20',
    endDate: '2024-04-20',
    type: 'challenge',
    prize: {
      type: 'certificate',
      value: 'Skill Certificate + Digital Badge'
    },
    participants: [
      { id: 'u10', name: 'Alex Johnson', avatar: 'https://placehold.co/100x100' },
      { id: 'u11', name: 'Rachel Green', avatar: 'https://placehold.co/100x100' }
    ],
    maxParticipants: 200,
    skills: ['Algorithms', 'Data Structures', 'Problem Solving'],
    difficulty: 'beginner',
    status: 'ongoing',
    bannerImage: 'https://placehold.co/1200x630/dc2626/ffffff?text=Coding+Challenge'
  },
  {
    id: '5',
    title: 'Mobile App Innovation Contest',
    description: 'Create innovative mobile apps to solve educational challenges. Opportunity to receive startup funding.',
    startDate: '2024-06-01',
    endDate: '2024-07-15',
    type: 'competition',
    prize: {
      type: 'cash',
      value: '$75,000 + Seed Funding'
    },
    sponsor: {
      name: 'EduTech Global',
      logo: 'https://placehold.co/100x100'
    },
    participants: [
      { id: 'u12', name: 'Thomas Wright', avatar: 'https://placehold.co/100x100' }
    ],
    maxParticipants: 50,
    skills: ['Mobile Development', 'UI/UX', 'Business Model'],
    difficulty: 'advanced',
    status: 'upcoming',
    bannerImage: 'https://placehold.co/1200x630/7c3aed/ffffff?text=Mobile+App+Contest'
  }
];

export function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>(dummyEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'competitions' | 'challenges'>('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Memindahkan featured events ke useMemo untuk konsistensi
  const featuredEvents = React.useMemo(() => {
    return events
      .filter(event => event.status === 'upcoming' && event.sponsor)
      .sort((a, b) => {
        // Pertama, urutkan berdasarkan nilai hadiah
        const aValue = a.prize.value.includes('Rp') ? 
          parseInt(a.prize.value.replace(/[^0-9]/g, '')) : 0;
        const bValue = b.prize.value.includes('Rp') ? 
          parseInt(b.prize.value.replace(/[^0-9]/g, '')) : 0;
        
        if (bValue !== aValue) {
          return bValue - aValue;
        }
        
        // Jika nilai hadiah sama, urutkan berdasarkan tanggal
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      })
      .slice(0, 3);
  }, [events]);

  const nextSlide = React.useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  }, [featuredEvents.length]);

  const prevSlide = React.useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  }, [featuredEvents.length]);

  // Reset current slide when featured events change
  useEffect(() => {
    setCurrentSlide(0);
  }, [featuredEvents]);

  // Auto slide dengan dependencies yang tepat
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, featuredEvents.length]);

  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'competitions':
        return event.type === 'competition' || event.type === 'hackathon';
      case 'challenges':
        return event.type === 'challenge';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-[500px] bg-gray-200 rounded-lg mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events & Competitions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join exciting challenges and competitions to showcase your skills
          </p>
      </div>

      {featuredEvents.length > 0 && (
          <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
              <IoChevronBackOutline className="w-5 h-5" />
          </button>
            <div className="flex gap-1.5">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'w-6 bg-primary-500' 
                      : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          <button
            onClick={nextSlide}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
              <IoChevronForwardOutline className="w-5 h-5" />
          </button>
          </div>
        )}
      </div>

      {/* Featured Events Carousel */}
      {featuredEvents.length > 0 && (
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-gray-900 group">
          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="aspect-[21/9] w-full">
                <img 
                  src={featuredEvents[currentSlide].bannerImage} 
                  alt={featuredEvents[currentSlide].title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="max-w-6xl w-full mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500 text-white">
                      {featuredEvents[currentSlide].type.charAt(0).toUpperCase() + featuredEvents[currentSlide].type.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white backdrop-blur-sm">
                      {featuredEvents[currentSlide].difficulty.charAt(0).toUpperCase() + featuredEvents[currentSlide].difficulty.slice(1)}
                    </span>
                    {featuredEvents[currentSlide].sponsor && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white backdrop-blur-sm">
                        Sponsored by {featuredEvents[currentSlide].sponsor.name}
                      </span>
                    )}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
                      {featuredEvents[currentSlide].title}
                    </h2>
                    <p className="text-gray-200 mb-6 text-lg max-w-3xl leading-relaxed">
                      {featuredEvents[currentSlide].description}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">
                          {new Date(featuredEvents[currentSlide].startDate).toLocaleDateString('en-US', { 
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-white">
                          {featuredEvents[currentSlide].prize.value}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {featuredEvents[currentSlide].participants.slice(0, 3).map((participant, index) => (
                            <div 
                              key={participant.id}
                              className="relative"
                              style={{ zIndex: 3 - index }}
                            >
                              {participant.avatar ? (
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="w-7 h-7 rounded-full ring-2 ring-gray-900"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-700 ring-2 ring-gray-900 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-300">
                                    {participant.name[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-300">
                          {featuredEvents[currentSlide].participants.length} / {featuredEvents[currentSlide].maxParticipants} Participants
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="px-8 flex-shrink-0"
                    >
                      Join Now
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Events
        </Button>
        <Button
          variant={filter === 'competitions' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('competitions')}
        >
          Competitions
        </Button>
        <Button
          variant={filter === 'challenges' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('challenges')}
        >
          Challenges
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <Card key={event.id} className="group hover:border-gray-300 transition-all duration-200">
              {/* Event Image */}
              <div className="aspect-[16/9] w-full rounded-t-lg overflow-hidden">
                <img 
                  src={event.bannerImage} 
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Event Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span 
                    className={`px-2.5 py-1 rounded-full text-xs font-medium 
                      ${event.type === 'competition' ? 'bg-purple-50 text-purple-600' : 
                      event.type === 'challenge' ? 'bg-blue-50 text-blue-600' : 
                      'bg-orange-50 text-orange-600'}`}
                  >
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                    ${event.status === 'upcoming' ? 'bg-green-50 text-green-600' :
                    event.status === 'ongoing' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-600'}`}
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {new Date(event.startDate).toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {event.participants.slice(0, 3).map((participant, index) => (
                      <div 
                        key={participant.id} 
                        className="relative"
                        style={{ zIndex: 3 - index }}
                      >
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-6 h-6 rounded-full ring-2 ring-white"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {participant.name[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {event.participants.length > 3 && (
                      <div 
                        className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white"
                        style={{ zIndex: 0 }}
                      >
                        <span className="text-xs font-medium text-gray-600">
                          +{event.participants.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No Events Found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {filter === 'competitions' 
                ? 'No competitions are currently available. Check back later!'
                : filter === 'challenges'
                ? 'No challenges are currently available. Check back later!'
                : 'No events found. New events will be added soon!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
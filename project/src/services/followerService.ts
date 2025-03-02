import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';

interface FollowerRelation {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  try {
    if (followerId === followingId) {
      throw new Error('Users cannot follow themselves');
    }

    const batch = writeBatch(db);

    // Create the follow relationship document
    const followDoc = doc(db, 'followers', `${followerId}_${followingId}`);
    const followData: FollowerRelation = {
      followerId,
      followingId,
      createdAt: new Date().toISOString()
    };
    
    // Update follower's following count
    const followerRef = doc(db, 'users', followerId);
    
    // Update following user's followers count
    const followingRef = doc(db, 'users', followingId);

    // Check if already following
    const followSnapshot = await getDoc(followDoc);
    if (followSnapshot.exists()) {
      throw new Error('Already following this user');
    }

    // Add the follow relationship
    batch.set(followDoc, followData);
    
    // Increment following count for follower
    batch.update(followerRef, {
      'stats.followingCount': increment(1)
    });

    // Increment followers count for following
    batch.update(followingRef, {
      'stats.followersCount': increment(1)
    });

    await batch.commit();
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get the follow relationship document
    const followDoc = doc(db, 'followers', `${followerId}_${followingId}`);
    
    // Get references to both users
    const followerRef = doc(db, 'users', followerId);
    const followingRef = doc(db, 'users', followingId);

    // Check if the relationship exists
    const followSnapshot = await getDoc(followDoc);
    if (!followSnapshot.exists()) {
      throw new Error('Not following this user');
    }

    // Remove the follow relationship
    batch.delete(followDoc);
    
    // Decrement following count for follower
    batch.update(followerRef, {
      'stats.followingCount': increment(-1)
    });

    // Decrement followers count for following
    batch.update(followingRef, {
      'stats.followersCount': increment(-1)
    });

    await batch.commit();
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
}

export async function getFollowers(userId: string): Promise<UserProfile[]> {
  try {
    const followersQuery = query(
      collection(db, 'followers'),
      where('followingId', '==', userId)
    );

    const followersSnapshot = await getDocs(followersQuery);
    const followerIds = followersSnapshot.docs.map(doc => doc.data().followerId);

    const followers: UserProfile[] = [];
    for (const followerId of followerIds) {
      const userDoc = await getDoc(doc(db, 'users', followerId));
      if (userDoc.exists()) {
        followers.push(userDoc.data() as UserProfile);
      }
    }

    return followers;
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
}

export async function getFollowing(userId: string): Promise<UserProfile[]> {
  try {
    const followingQuery = query(
      collection(db, 'followers'),
      where('followerId', '==', userId)
    );

    const followingSnapshot = await getDocs(followingQuery);
    const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

    const following: UserProfile[] = [];
    for (const followingId of followingIds) {
      const userDoc = await getDoc(doc(db, 'users', followingId));
      if (userDoc.exists()) {
        following.push(userDoc.data() as UserProfile);
      }
    }

    return following;
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const followDoc = doc(db, 'followers', `${followerId}_${followingId}`);
    const followSnapshot = await getDoc(followDoc);
    return followSnapshot.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
}

export async function getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
  try {
    console.log('Getting follow stats for user:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('User document not found for ID:', userId);
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    console.log('User data retrieved:', userData);
    console.log('User stats:', userData.stats);
    
    const stats = {
      followers: userData.stats?.followersCount || 0,
      following: userData.stats?.followingCount || 0
    };
    
    console.log('Returning follow stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting follow stats:', error);
    console.error('User ID:', userId);
    throw error;
  }
} 
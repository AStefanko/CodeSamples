import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;

/**
Part of an academic assignment involving creating a cache
Other methods and classes are not included in this repo
*/

public class Cachesim2 {

		static ArrayList<ArrayList<Block2>> cache = new ArrayList<ArrayList<Block2>>();
		
		//these things are the things from command line
		static int asso;
		static int bSize;
		static int cSize;
		static String address00;
		
		
		//Other things
		static int nSets; //number of sets
		static AdData addr; //address to be split
		static MainMemory memory; //memory
		static Block2 bl; //the block being referenced
		static int clock; 
		static String oBits;
		
		static Operations op; 
		


		public static void Cachesimz(String add, String toStore) {
			addr= new AdData(add, bSize, asso, cSize);
			bl = new Block2(add, bSize, asso, cSize, toStore);
			oBits=bl.offBits;
			clock=0;	
		}
		
		//number of sets
		public static void nSets(int cSize) { 
			int nBlocks = (cSize*1000)/bSize;
			int sets = nBlocks/asso;
			if(sets==0) {
				nSets=1;
			} else {
				nSets=sets;
			}
			
			System.out.println("nSets in nSets: " + nSets);
		}
		
		//makingcache the right size
		public static void cacheMaker(int sets, int cSize) { 
			for(int i=0; i<nSets; i++) {
				cache.add(new ArrayList<Block2>());
				for(int j=0; j<asso; j++) {
					Block2 toPut= new Block2("", bSize, asso, cSize, "");
					cache.get(i).add(toPut);
				}
			}
		}

		 
		
		public static String load(String address, int acVal) {
			String[] bytes = new String[acVal];
			String StringFromMem="";
			int idx = addr.mIndex;
			
			//This segment deals with load hits 
			for(int i=0; i<asso; i++) {
				if((cache.get(idx).get(i).tag).equals(addr.tagBits) && cache.get(idx).get(i).isValid()) {
					bytes = cache.get(idx).get(i).getData(acVal, oBits);
					for(int j=0; j<bytes.length; j++) {
						StringFromMem+=bytes[j];
					}
					cache.get(idx).get(i).setClock(clock); //set the clock
					return "load" + addr + "hit" + StringFromMem;
				}
			}
			int memAdd = op.hexToDec(address);
			String[] stuffFromMem=memory.get(memAdd, acVal);
			String toPut="";
			for(int i=0; i<stuffFromMem.length; i++) {
				toPut+=stuffFromMem[i];
			}


			//Deals with load misses where a block doesn't need to be evicted 
			for(int a=0; a<asso; a++) {
				if(!cache.get(idx).get(a).isValid()) { //if not valid, there is room
					cache.get(idx).set(a, new Block2(address, bSize, asso, cSize, toPut));
					cache.get(idx).get(a).setClock(clock); //set the clock
					return "load " + address00 + " miss " + stuffFromMem.toString();
				}
			}
			//Getting the least recently accesssed block so it can be replaced 
			ArrayList<Integer> clocks=new ArrayList<Integer>();
			for(int c=0; c<asso; c++) {
				clocks.add(cache.get(idx).get(c).getClock());
			}
			int minClock = Collections.min(clocks);
			//this is where stuff gets evicted and replaced 
			
			for(int d=0; d<asso; d++) {
				if(cache.get(idx).get(d).getClock()==minClock) {
					if(cache.get(idx).get(d).isDirty()) { //if the bit is dirty, load stuff into memory on a miss
						memory.toMem(memAdd, acVal, stuffFromMem);
					}
					cache.get(idx).set(d, new Block2(address, bSize, asso, cSize, toPut)); //update the stuff 
					cache.get(idx).get(d).setClock(clock); //set the clock
					return "load " + address00 + " miss " + stuffFromMem.toString();
				}
			}
			return "";
		}
		
		//Handles cache stores
		public static String store(String address, int acVal, String toStore) {
			int idx = addr.mIndex;
			//this is the address in memory
			int memAdd = op.hexToDec(address) - (op.hexToDec(address) % bSize);

			//If there is a store HIT
			for(int i=0; i<asso; i++) {
				if((cache.get(idx).get(i).tag).equals(addr.tagBits) && cache.get(idx).get(i).isValid()) {
					cache.get(idx).set(i, new Block2(address, bSize, asso, cSize, toStore)); //if its in the cache just update what is stored in there
					cache.get(idx).get(i).setClock(clock);
					cache.get(idx).get(i).setDirty(); //now that it has been modified, set it to be dirty.
					return "store " + toStore + " hit"; 
				}
				else {
					continue;
				}
			}
			//Deals with store misses 
			for(int i=0; i<asso; i++) {
				//Store miss where there is room to store
				if(!cache.get(idx).get(i).isValid()) { 
					
					cache.get(idx).set(i, new Block2(address, bSize, asso, cSize, toStore));
					
					String[] goesIntoMem = new String[toStore.length()];
					for(int k=0; k<toStore.length(); k++) {
						String temp="";
						temp+=toStore.charAt(k);
						goesIntoMem[k]=temp;
					}	
					cache.get(idx).get(i).setClock(clock); //set the clock
					cache.get(idx).get(i).setVal(); //set the valid to be 1
					return "store " + toStore + " miss"; 
				}
				//Store miss if the blocks are full and something must be evicted 
				ArrayList<Integer> clocks=new ArrayList<Integer>();
				for(int c=0; c<asso; c++) {
					clocks.add(cache.get(idx).get(c).getClock());
				}
				//evict and replace blocks 
				String[] stufftoMem = new String[toStore.length()];
				int min = Collections.min(clocks);
				for(int d=0; d<asso; d++) {
					if(cache.get(idx).get(d).getClock()==min) {
						if(cache.get(idx).get(d).isDirty()) { //if the bit is dirty, load stuff into memory on a miss
							memory.toMem(memAdd, acVal, stufftoMem);
						}
						cache.get(idx).set(d, new Block2(address, bSize, asso, cSize, stufftoMem.toString())); //replace the blocks 
						cache.get(idx).get(d).setClock(clock);
						return "store " + address00 + " miss ";
					}
				}
			
			}
			return "";

		}
		
		
		public static void main(String[] args) {
			//asso is associativity, bSize is block 
			cSize=1;
			asso=64;
			bSize = 16;
			
			clock=0;
			memory = new MainMemory(Math.pow(2, 24)); //this makes the huge memory wowzas
			nSets(cSize);
			cacheMaker(nSets, cSize);
			
			String fileName="test2.txt";
			String line = null;
			String toStore="";
			try {
				FileReader fileR = new FileReader(fileName);
				BufferedReader buffR = new BufferedReader(fileR);
				while((line=buffR.readLine())!=null) {
					String[] vars = line.split(" ");
					String lOst=vars[0];
					String addresss=vars[1];
					address00=addresss;
					int byteAccess = Integer.parseInt(vars[2]);
					if(vars.length>3) {
						toStore=vars[3];
					} else {
						toStore="";
					}
					Cachesimz(addresss, toStore);
					if(lOst.equals("load")) {
						String finna = load(addresss, byteAccess);
					} else {
						String finna = store(addresss, byteAccess, toStore);
					}
					clock++;
				}
				buffR.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				System.out.println("file error");
			} catch(IOException e) {
				System.out.println("IOException");
			}

			
		}
}
